import { parseStringPromise } from "xml2js";
import fetch from "node-fetch";
import { isFilled } from "ts-is-present";
import { uniqBy } from "lodash";
import { firstValueFrom, from } from "rxjs";
import { filter, mergeMap, toArray } from "rxjs/operators";
import { EpgSource, epgSources } from "./epg-sources";

export interface EpgProgramme {
  start: string;
  stop: string;
  channel: string;
  title: string;
  desc: string;
  icon: string;
}

export interface EpgChannel {
  id: string;
  icon: string;
}

type EpgParseResult = {
  channels: EpgChannel[];
  programs: EpgProgramme[];
};

type EpgResult = EpgParseResult & {
  relatedCountries: EpgSource["countryCode"][];
};

let epgResultsP: Promise<EpgResult[]>;
let checker;

const parseXml = parseStringPromise;

const parseEpg = async (content: string): Promise<EpgParseResult> => {
  return parseXml(content.replace(/&/g, "&amp;")).then((_) => {
    return {
      channels: (_.tv.channel as any[]).map<EpgChannel>((item) => {
        return {
          icon: item.icon?.[0].$.src,
          ...item["$"],
        };
      }),
      programs: (_.tv.programme as any[]).map<EpgProgramme>((item) => {
        return {
          title: item.title[0]._,
          desc: item.desc?.[0]._,
          icon: item.icon?.[0].$.src,
          ...item["$"],
        };
      }),
    };
  });
};

const _handleEpgSource = async (
  source: EpgSource
): Promise<EpgResult | null> => {
  const resp = await fetch(source.url);
  const relatedCountries = epgSources
    .filter((_) => _.url === source.url)
    .map((_) => _.countryCode);

  if (!resp.ok) {
    console.warn(`Response is not OK: ${source.url}`);
    return null;
  }

  const contents = await resp.text();
  const parsedResp = await parseEpg(contents);

  return Object.assign(parsedResp, { relatedCountries });
};

const _fetchEpg = (epgSources: EpgSource[]): void => {
  console.log("Updating epg...");
  const epgChecker$ = from(uniqBy(epgSources, (_) => _.url)).pipe(
    mergeMap(
      (source) =>
        _handleEpgSource(source).catch((err) => {
          console.error(`Error happened at ${source.url}`);
          console.error(err);
          return null;
        }),
      2
    ),
    filter(isFilled),
    toArray()
  );

  epgResultsP = firstValueFrom(epgChecker$);

  epgResultsP.then((p) => {
    console.log("Epg updated. EPG sources parsed count:", p.length);
  });
};

export const bootstrap = (epgUrls: EpgSource[]): void => {
  _fetchEpg(epgUrls);
  checker = setInterval(() => {
    _fetchEpg(epgUrls);
  }, 1000 * 60 * 10);
};

export const stopPolling = (): void => {
  checker && clearInterval(checker);
};

// 20210423071700 +0000 -> timestamp
export const parseDate = (dateStr: string): number => {
  if (!dateStr) return 0;
  return +new Date(
    `${dateStr.substr(0, 4)}-${dateStr.substr(4, 2)}-${dateStr.substr(
      6,
      2
    )} ${dateStr.substr(8, 2)}:${dateStr.substr(10, 2)}:${dateStr.substr(
      12,
      2
    )} +0`
  );
};

export const getChannels = async (
  channelIds?: string[]
): Promise<EpgChannel[]> => {
  const channelsMap: { [channelId: string]: boolean } = (
    channelIds || []
  ).reduce((acc, value) => {
    acc[value] = true;
    return acc;
  }, {});

  return epgResultsP.then((parseResults) => {
    const channels = uniqBy(
      parseResults.map((_) => _.channels).flat(2),
      (_) => _.id
    );

    return channelIds ? channels.filter((_) => channelsMap[_.id]) : channels;
  });
};

export const getProgrammes = async (
  channelId: string
): Promise<EpgProgramme[]> => {
  const epgResults = await epgResultsP;
  const channelCountryCode = channelId.split(".").pop();

  const sourceResult =
    epgResults.find((_) => {
      return (
        channelCountryCode &&
        _.relatedCountries.indexOf(channelCountryCode) !== -1
      );
    }) ||
    epgResults.find((_) => {
      return _.programs.some((program) => program.channel === channelId);
    });

  if (!sourceResult) {
    return [];
  }

  return sourceResult.programs.filter((_) => _.channel === channelId);
};
