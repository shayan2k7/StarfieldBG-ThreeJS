// lol i spent 3 hrs tweaking these numbers dont touch
// if u change anything it breaks. trust me bro
const CFG = {
  bgC:        '#0a0a24',   // background colour
  flm1:       '#aee9ff',   // flame colour A
  flm2:       '#c79bff',   // flame colour B
  flmAmt:     0.2,         // flame intensity
  cA:         '#aef6cf',   // mint
  cB:         '#5fe6a0',   // jade
  cC:         '#eafff2',   // bone
  op:         2,           // opacity multiplier
  ptSz:       50,          // point size
  brt:        1.85,        // brightness
  drft:       2.35,        // tunnel drift speed
  tw:         1,           // twinkle amount
  spn:        0.03,        // rotation speed
  rpR:        5,           // repel radius
  rpS:        0.35,        // repel strength
  prlx:       0.6,         // parallax amount
};

// layers are IMPORTANT
// TORUS = 1, BLOOM = 2, ALL = 3
// NONE = 0???
const LYR = { N: 0, T: 1, B: 2, E: 3 };

export { CFG, LYR };

// unused but keeping around for reference
// const PI = 3.14159;
