import { createAddon, IptvItem, MovieItem, runCli } from "@mediaurl/sdk";
import fetch from "node-fetch";
import cuid from "cuid";
import { groupBy } from "lodash";

import { IptvCategories, IptvCountries, IptvLanguages } from "./iptv-filters";
import { Channel } from "./iptv";
import {
  bootstrap as bootstrapEpg,
  getChannels,
  getProgrammes,
  parseDate,
} from "./epg.service";
import { epgSources } from "./epg-sources";

const exampleAddon = createAddon({
  id: "iptv-channels",
  name: "IPTV Channels",
  version: "0.0.0",
  catalogs: [
    {
      itemTypes: ["iptv"],
      features: {
        search: { enabled: true },
        filter: [IptvCategories, IptvCountries, IptvLanguages],
      },
    },
  ],
});

exampleAddon.registerActionHandler("catalog", async (input, ctx) => {
  console.log("catalog", input);

  const region = input.region.toLowerCase();
  const { search } = input;
  const { category, country, language } = input.filter;

  const channels = await ctx.cache.call<Channel[]>("channels", async () =>
    fetch("https://iptv-org.github.io/iptv/channels.json").then(
      async (resp) => {
        if (!resp.ok) {
          throw new Error(await resp.text());
        }

        return resp.json();
      }
    )
  );

  const filteredChannels = channels
    /** Country filter */
    .filter((_) => {
      return _.countries.some(({ code }) =>
        country
          ? code === country
          : !language && !search
          ? code === region
          : true
      );
    })
    /** Language filter */
    .filter((_) => {
      return _.languages.some(({ code }) =>
        language ? language === code : true
      );
    })
    /** Category filter */
    .filter((_) => (category ? (_.category || "Unsorted") === category : true))
    /** Search filter */
    .filter((_) =>
      search ? _.name.toLowerCase().indexOf(search.toLowerCase()) !== -1 : true
    );

  const channelIds = filteredChannels.map((_) => _.tvg.id).filter((_) => _);

  const groupedPrograms = groupBy(
    await Promise.all(
      channelIds.map((channelId) =>
        getProgrammes(channelId).then((programs) => ({
          programs,
          channelId,
        }))
      )
    ),
    (_) => _.channelId
  );

  const groupedEpgChannels = groupBy(
    await getChannels(channelIds),
    (_) => _.id
  );

  return {
    items: filteredChannels.map(
      (_): IptvItem => {
        const epgIcon = (groupedEpgChannels[_.tvg.id] || []).find((_) => _.icon)
          ?.icon;

        return {
          type: "iptv",
          name: _.name,
          ids: {
            id: cuid(),
          },
          url: _.url,
          logo: epgIcon || (/:\/\//.test(_.logo) ? _.logo : null),
          epg:
            _.tvg.id && groupedPrograms[_.tvg.id]
              ? groupedPrograms[_.tvg.id][0].programs
                  .map((program) => {
                    return {
                      start: parseDate(program.start),
                      stop: parseDate(program.stop),
                      name: program.title,
                      description: program.desc,
                      poster: program.icon,
                    };
                  })
                  .filter((item) => {
                    // Is running now or will start next 4 hours
                    return (
                      item.stop >= +new Date() &&
                      item.start <= +new Date() + 1000 * 60 * 60 * 4
                    );
                  })
              : undefined,
        };
      }
    ),
    nextCursor: null,
  };
});

bootstrapEpg(epgSources);

runCli([exampleAddon]);
