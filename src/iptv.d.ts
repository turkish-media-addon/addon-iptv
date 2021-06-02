interface Language {
  code: string;
}

interface Country {
  code: string;
}

export interface Channel {
  name: string;
  logo: string;
  url: string;
  category: string;
  languages: Language[];
  countries: Country[];
  tvg: {
    id: string;
    name: string;
    url: string;
  };
}
