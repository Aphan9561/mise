export type TechniqueDefinition = {
  term: string;
  explanation: string;
  cue: string;
};

export const techniqueDefinitions: TechniqueDefinition[] = [
  {
    term: "braise",
    explanation:
      "Brown the food first, then cook it slowly with a small amount of liquid until it turns tender.",
    cue: "Look for gentle bubbles, not a rolling boil.",
  },
  {
    term: "deglaze",
    explanation:
      "Add liquid to a hot pan and scrape up the browned bits stuck to the bottom. Those bits carry concentrated flavor.",
    cue: "The liquid should hiss when it hits the pan.",
  },
  {
    term: "fold",
    explanation:
      "Use a spatula to gently lift and turn a lighter mixture into a heavier one without knocking out too much air.",
    cue: "Stop once the streaks are mostly gone.",
  },
  {
    term: "julienne",
    explanation:
      "Cut food into thin matchsticks so it cooks evenly and blends cleanly into a dish.",
    cue: "Aim for pieces about the width of a matchstick.",
  },
  {
    term: "mince",
    explanation:
      "Cut an ingredient into very small pieces so its flavor spreads through the dish.",
    cue: "Garlic and herbs should look finely chopped, not chunky.",
  },
  {
    term: "reduce",
    explanation:
      "Simmer liquid so water evaporates and the sauce becomes thicker and more flavorful.",
    cue: "Drag a spoon through the pan; it should leave a brief trail.",
  },
  {
    term: "simmer",
    explanation:
      "Cook liquid just below a boil, with small bubbles gently breaking the surface.",
    cue: "Lower the heat if the pot starts aggressively bubbling.",
  },
  {
    term: "sear",
    explanation:
      "Cook the surface of food over high heat until it develops a browned crust.",
    cue: "Let the food sit still long enough to release naturally.",
  },
  {
    term: "saute",
    explanation:
      "Cook small pieces of food quickly in a little fat over medium-high heat.",
    cue: "The pan should sound lively but not smell burnt.",
  },
  {
    term: "whisk",
    explanation:
      "Beat ingredients with a whisk to combine, smooth, or add air.",
    cue: "Use quick circles or side-to-side strokes.",
  },
];

const normalizedDefinitions = new Map(
  techniqueDefinitions.map((definition) => [
    definition.term.toLowerCase(),
    definition,
  ]),
);

export const techniqueTerms = techniqueDefinitions.map(
  (definition) => definition.term,
);

export function findTechniqueDefinition(term: string) {
  return normalizedDefinitions.get(term.toLowerCase());
}
