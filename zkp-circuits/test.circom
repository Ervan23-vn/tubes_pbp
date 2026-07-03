include "node_modules/circomlib/circuits/comparators.circom";

template Main() {
  signal input a;
  signal input b;
  signal output o;
  component gt = GreaterThan(8);
  gt.in[0] <== a;
  gt.in[1] <== b;
  o <== gt.out;
}

component main = Main();
