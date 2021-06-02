import lookup from "country-code-lookup";
import emojiRegex from "emoji-regex";

const emojiCleanerRegex = emojiRegex();

export interface EpgSource {
  country: string;
  countryCode: string;
  url: string;
}

/**
  * Extracted from https://github.com/iptv-org/epg#usage
  ```
  Array.from(
  document.querySelector('table').querySelectorAll('tr')
)
  .map(elem => {
    return Array.from(elem.querySelectorAll('td'))
  })
  .filter(pair => pair.length)
  .map(([countryNode, epgNode]) => {
    return [countryNode.textContent, epgNode.textContent]
  })
  ```
 */
const githubInput = [
  ["🇦🇱 Albania", "https://iptv-org.github.io/epg/guides/albepg.com.guide.xml"],
  [
    "🇦🇩 Andorra",
    "https://iptv-org.github.io/epg/guides/andorradifusio.ad.guide.xml",
  ],
  ["🇦🇷 Argentina", "https://iptv-org.github.io/epg/guides/mi.tv.guide.xml"],
  [
    "🇦🇺 Australia",
    "https://iptv-org.github.io/epg/guides/ontvtonight.com.guide.xml",
  ],
  [
    "🇧🇾 Belarus",
    "https://iptv-org.github.io/epg/guides/tv.yandex.ru.guide.xml",
  ],
  [
    "🇧🇴 Bolivia",
    "https://iptv-org.github.io/epg/guides/comteco.com.bo.guide.xml",
  ],
  ["🇧🇷 Brazil", "https://iptv-org.github.io/epg/guides/mi.tv.guide.xml"],
  ["🇨🇦 Canada", "https://iptv-org.github.io/epg/guides/tvtv.ca.guide.xml"],
  ["🇨🇱 Chile", "https://iptv-org.github.io/epg/guides/mi.tv.guide.xml"],
  ["🇨🇴 Colombia", "https://iptv-org.github.io/epg/guides/mi.tv.guide.xml"],
  [
    "🇨🇿 Czech Republic",
    "https://iptv-org.github.io/epg/guides/m.tv.sms.cz.guide.xml",
  ],
  ["🇸🇻 El Salvador", "https://iptv-org.github.io/epg/guides/mi.tv.guide.xml"],
  ["🇫🇮 Finland", "https://iptv-org.github.io/epg/guides/telkussa.fi.guide.xml"],
  [
    "🇫🇷 France",
    "https://iptv-org.github.io/epg/guides/programme-tv.net.guide.xml",
  ],
  ["🇩🇪 Germany", "https://iptv-org.github.io/epg/guides/hd-plus.de.guide.xml"],
  ["🇬🇷 Greece", "https://iptv-org.github.io/epg/guides/cosmote.gr.guide.xml"],
  ["🇬🇹 Guatemala", "https://iptv-org.github.io/epg/guides/mi.tv.guide.xml"],
  ["🇭🇳 Honduras", "https://iptv-org.github.io/epg/guides/mi.tv.guide.xml"],
  [
    "🇮🇹 Italy",
    "https://iptv-org.github.io/epg/guides/guidatv.sky.it.guide.xml",
  ],
  [
    "🇮🇪 Ireland",
    "https://iptv-org.github.io/epg/guides/ontvtonight.com.guide.xml",
  ],
  [
    "🇰🇿 Kazakhstan",
    "https://iptv-org.github.io/epg/guides/tv.yandex.ru.guide.xml",
  ],
  [
    "🇲🇾 Malaysia",
    "https://iptv-org.github.io/epg/guides/astro.com.my.guide.xml",
  ],
  ["🇲🇽 Mexico", "https://iptv-org.github.io/epg/guides/mi.tv.guide.xml"],
  ["🇵🇾 Paraguay", "https://iptv-org.github.io/epg/guides/mi.tv.guide.xml"],
  ["🇵🇪 Peru", "https://iptv-org.github.io/epg/guides/mi.tv.guide.xml"],
  [
    "🇵🇱 Poland",
    "https://iptv-org.github.io/epg/guides/programtv.onet.pl.guide.xml",
  ],
  ["🇵🇹 Portugal", "https://iptv-org.github.io/epg/guides/meo.pt.guide.xml"],
  [
    "🇷🇴 Romania",
    "https://iptv-org.github.io/epg/guides/programetv.ro.guide.xml",
  ],
  ["🇷🇺 Russia", "https://iptv-org.github.io/epg/guides/tv.yandex.ru.guide.xml"],
  [
    "🇪🇸 Spain",
    "https://iptv-org.github.io/epg/guides/programacion-tv.elpais.com.guide.xml",
  ],
  ["🇸🇪 Sweden", "https://iptv-org.github.io/epg/guides/telkussa.fi.guide.xml"],
  [
    "🇹🇷 Turkey",
    "https://iptv-org.github.io/epg/guides/digiturk.com.tr.guide.xml",
  ],
  ["🇺🇦 Ukraine", "https://iptv-org.github.io/epg/guides/tvgid.ua.guide.xml"],
  [
    "🇬🇧 United Kingdom",
    "https://iptv-org.github.io/epg/guides/ontvtonight.com.guide.xml",
  ],
  [
    "🇺🇸 United States",
    "https://iptv-org.github.io/epg/guides/tvtv.us.guide.xml",
  ],
  ["🇿🇲 Zambia", "https://iptv-org.github.io/epg/guides/znbc.co.zm.guide.xml"],
];

export const epgSources: EpgSource[] = githubInput.reduce(
  (acc, [country, url]) => {
    const countryCode = lookup
      .byCountry(country.replace(emojiCleanerRegex, "").trim())
      ?.iso2.toLowerCase();

    if (!countryCode) {
      throw new Error(`Unable to detect country code for ${country}`);
    }

    acc.push({
      country,
      url,
      countryCode,
    });

    return acc;
  },
  [] as EpgSource[]
);
