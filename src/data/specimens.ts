export type Specimen = {
  id: string;
  name: string;
  latin: string;
  group: string;
  size: string;
  microns: number;
  color: string;
  habitat: string;
  intro: string;
  fact: string;
  parts: { name: string; note: string; point: [number, number, number] }[];
  source: string;
  image: string;
  model: string;
};
const data = [
  {
    id: "tardigrade",
    name: "Tardigrade",
    latin: "Phylum Tardigrada",
    group: "Micro-animal",
    size: "100–1,000 µm",
    microns: 500,
    color: "#b48055",
    habitat: "Water films in moss & lichen",
    intro:
      "Eight little legs. An extraordinary survivor. Water bears explore their microscopic world with clawed feet and a flexible, segmented body.",
    fact: "Some species survive drying by entering a dormant state called a tun. They still need water to be active.",
    parts: [
      {
        name: "Clawed legs",
        note: "Four pairs of short legs grip surfaces. The rear pair helps the animal anchor itself.",
        point: [-0.6, -0.6, 0.7],
      },
      {
        name: "Cuticle",
        note: "A flexible outer covering protects the body and is shed as the animal grows.",
        point: [0, 0.6, 0.5],
      },
      {
        name: "Mouth apparatus",
        note: "A mouth and paired piercing stylets allow feeding. Diet varies between species.",
        point: [1.2, 0.2, 0.5],
      },
    ],
    source:
      "https://www.si.edu/stories/what-species-will-be-earths-last-survivors",
  },
  {
    id: "rotifer",
    name: "Rotifer",
    latin: "Class Bdelloidea",
    group: "Micro-animal",
    size: "150–700 µm",
    microns: 300,
    color: "#aa7885",
    habitat: "Freshwater plants & damp moss",
    intro:
      "A tiny animal with a remarkable crown. Beating cilia gather suspended food toward its mouth, giving rotifers their “wheel bearer” name.",
    fact: "The wheels are an optical effect of beating cilia, not rotating body parts.",
    parts: [
      {
        name: "Ciliated crown",
        note: "Two ciliated lobes create water currents that carry food toward the mouth.",
        point: [0, 1.2, 0.4],
      },
      {
        name: "Contractile trunk",
        note: "The flexible body extends and retracts. Internal organs occupy the trunk.",
        point: [0, 0, 0.5],
      },
      {
        name: "Anchoring foot",
        note: "The narrow foot and toes help attach the animal to a surface.",
        point: [0, -1.3, 0.3],
      },
    ],
    source: "https://www.microscopy-uk.org.uk/mag/articles/winrotif.html",
  },
  {
    id: "daphnia",
    name: "Water flea",
    latin: "Genus Daphnia",
    group: "Crustacean",
    size: "500–5,000 µm",
    microns: 2000,
    color: "#c49250",
    habitat: "Plankton in ponds & lakes",
    intro:
      "A miniature crustacean in a translucent shell. Large antennae propel Daphnia through the water with a distinctive hopping motion.",
    fact: "A water flea is a crustacean, not an insect. Larger individuals can be seen without a microscope.",
    parts: [
      {
        name: "Compound eye",
        note: "A prominent single compound eye detects light and helps guide movement.",
        point: [0.4, 0.8, 0.5],
      },
      {
        name: "Swimming antennae",
        note: "The branched second antennae act like paddles during swimming.",
        point: [-0.8, 0.8, 0.4],
      },
      {
        name: "Carapace",
        note: "A folded shell encloses most of the body. Its transparency reveals internal structures.",
        point: [0, -0.2, 0.6],
      },
    ],
    source: "https://animaldiversity.org/accounts/Daphnia_magna/",
  },
  {
    id: "diatom",
    name: "Centric diatom",
    latin: "Centric diatom · illustrative form",
    group: "Single-celled alga",
    size: "10–200 µm",
    microns: 60,
    color: "#b09b58",
    habitat: "Freshwater & marine plankton",
    intro:
      "Living geometry, enclosed in glass. A diatom builds an intricately patterned silica shell around a single photosynthetic cell.",
    fact: "Its two overlapping shell halves fit together a little like the lid and base of a box.",
    parts: [
      {
        name: "Silica frustule",
        note: "The protective cell wall is made from hydrated silica and is called a frustule.",
        point: [0, 0.2, 0.7],
      },
      {
        name: "Patterned pores",
        note: "Tiny openings perforate the shell. Their arrangement differs between species.",
        point: [0.7, 0.6, 0.5],
      },
      {
        name: "Girdle bands",
        note: "Bands connect the overlapping valves around the sides of the shell.",
        point: [0.8, -0.4, 0.4],
      },
    ],
    source: "https://diatoms.org/what-are-diatoms",
  },
  {
    id: "desmid",
    name: "Desmid",
    latin: "Genus Micrasterias",
    group: "Single-celled alga",
    size: "100–400 µm",
    microns: 200,
    color: "#508976",
    habitat: "Quiet, low-nutrient freshwater",
    intro:
      "A single cell with astonishing symmetry. Deeply divided green lobes form two matching halves, joined by a narrow central bridge.",
    fact: "After division, each daughter cell retains one old half and grows a new one.",
    parts: [
      {
        name: "Semicells",
        note: "Two lobed halves form one cell. Their outline and symmetry help identify the organism.",
        point: [0, 0.8, 0.4],
      },
      {
        name: "Central isthmus",
        note: "A narrow connection joins the semicells. The nucleus occupies this central region.",
        point: [0, 0, 0.5],
      },
      {
        name: "Lobed margins",
        note: "Deep divisions give Micrasterias its elaborate star-like outline.",
        point: [1, 0.5, 0.3],
      },
    ],
    source: "https://www.desmids.nl/info/reproductie/asexual_reproduction.html",
  },
];
export const specimens: Specimen[] = data.map((d) => ({
  ...d,
  parts: d.parts.map((p) => ({
    ...p,
    point: p.point as [number, number, number],
  })),
  image: `/specimens/${d.id}.webp`,
  model: `/models/${d.id}.glb`,
}));
export const getSpecimen = (id: string) =>
  specimens.find((s) => s.id === id) ?? specimens[0];
