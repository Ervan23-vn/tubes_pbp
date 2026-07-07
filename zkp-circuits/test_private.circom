pragma circom 2.0.0;

template Main(){
  private signal input a;
  signal output b;
  b <== a;
}

component main = Main();
