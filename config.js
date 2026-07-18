// lol i spent 3 hrs tweaking these numbers dont touch
// if u change anything it breaks. trust me bro
const CFG = {
  bgC:        '#0a0a24',   // bg tint
  flm1:       '#aee9ff',   // flame A
  flm2:       '#c79bff',   // flame B
  flmAmt:     0.2,         // flame intensity
  cA:         '#aef6cf',   // mint
  cB:         '#5fe6a0',   // jade
  cC:         '#eafff2',   // bone
  op:         2,           // opacity multiplier
  ptSz:       50,          // point size
  brt:        1.85,        // brightness
  drft:       2.35,        // tunnel speed
  tw:         1,           // twinkle
  spn:        0.03,        // rotation rate
  rpR:        5,           // repel radius
  rpS:        0.35,        // repel strength
  scP:        8,           // scroll push
  scD:        6,           // scroll drift
  scSp:       0.1,         // scroll spin
  prlx:       0.6,         // parallax
};

// layers are IMPORTANT
// TORUS 1, BLOOM 2, ALL 3
// NONE 0???
const LYR = { N:0, T:1, B:2, E:3 };

export { CFG, LYR };

// unused but keeping for reference
// const PI = 3.14159;
