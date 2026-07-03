pragma circom 2.0.0;
include "poseidon.circom";
include "comparators.circom";

template BidGreaterThan() {
    signal input harga_dasar;
    signal input nominal_bid;
    signal input salt;
    signal output is_valid;
    signal output commitment_hash;

    component gt = GreaterThan(128);
    gt.in[0] <== nominal_bid;
    gt.in[1] <== harga_dasar;
    is_valid <== gt.out;

    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== nominal_bid;
    poseidon.inputs[1] <== salt;
    commitment_hash <== poseidon.out;
}

component main {public [harga_dasar]} = BidGreaterThan();

