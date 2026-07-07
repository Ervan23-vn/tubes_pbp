use serde::Deserialize;
use ark_bn254::{Bn254, Fq, Fq2, Fr, G1Affine, G2Affine};
use ark_groth16::{Groth16, VerifyingKey, Proof};
use ark_serialize::CanonicalDeserialize;
use std::str::FromStr;

#[derive(Deserialize)]
pub struct SnarkJsProof {
    pub pi_a: [String; 3],
    pub pi_b: [[String; 2]; 3],
    pub pi_c: [String; 3],
}

#[derive(Deserialize)]
pub struct SnarkJsVerifyingKey {
    pub vk_alpha_1: [String; 3],
    pub vk_beta_2: [[String; 2]; 3],
    pub vk_gamma_2: [[String; 2]; 3],
    pub vk_delta_2: [[String; 2]; 3],
    pub IC: Vec<[String; 3]>,
}

pub fn parse_proof(proof_json: &str) -> Result<Proof<Bn254>, String> {
    let raw: SnarkJsProof = serde_json_wasm::from_str(proof_json)
        .map_err(|e| format!("Proof JSON parse error: {}", e))?;
    
    let a_x = Fq::from_str(&raw.pi_a[0]).map_err(|_| "Invalid pi_a[0]".to_string())?;
    let a_y = Fq::from_str(&raw.pi_a[1]).map_err(|_| "Invalid pi_a[1]".to_string())?;
    let a = G1Affine::new_unchecked(a_x, a_y);
    
    let b_x0 = Fq::from_str(&raw.pi_b[0][0]).map_err(|_| "Invalid pi_b[0][0]".to_string())?;
    let b_x1 = Fq::from_str(&raw.pi_b[0][1]).map_err(|_| "Invalid pi_b[0][1]".to_string())?;
    let b_y0 = Fq::from_str(&raw.pi_b[1][0]).map_err(|_| "Invalid pi_b[1][0]".to_string())?;
    let b_y1 = Fq::from_str(&raw.pi_b[1][1]).map_err(|_| "Invalid pi_b[1][1]".to_string())?;
    
    let b_x = Fq2::new(b_x0, b_x1);
    let b_y = Fq2::new(b_y0, b_y1);
    let b = G2Affine::new_unchecked(b_x, b_y);
    
    let c_x = Fq::from_str(&raw.pi_c[0]).map_err(|_| "Invalid pi_c[0]".to_string())?;
    let c_y = Fq::from_str(&raw.pi_c[1]).map_err(|_| "Invalid pi_c[1]".to_string())?;
    let c = G1Affine::new_unchecked(c_x, c_y);
    
    Ok(Proof { a, b, c })
}

pub fn parse_verifying_key(vk_json: &str) -> Result<VerifyingKey<Bn254>, String> {
    let raw: SnarkJsVerifyingKey = serde_json_wasm::from_str(vk_json)
        .map_err(|e| format!("VerifyingKey JSON parse error: {}", e))?;
        
    let alpha_g1_x = Fq::from_str(&raw.vk_alpha_1[0]).map_err(|_| "alpha_g1_x".to_string())?;
    let alpha_g1_y = Fq::from_str(&raw.vk_alpha_1[1]).map_err(|_| "alpha_g1_y".to_string())?;
    let alpha_g1 = G1Affine::new_unchecked(alpha_g1_x, alpha_g1_y);
    
    let beta_g2_x0 = Fq::from_str(&raw.vk_beta_2[0][0]).map_err(|_| "beta_g2_x0".to_string())?;
    let beta_g2_x1 = Fq::from_str(&raw.vk_beta_2[0][1]).map_err(|_| "beta_g2_x1".to_string())?;
    let beta_g2_y0 = Fq::from_str(&raw.vk_beta_2[1][0]).map_err(|_| "beta_g2_y0".to_string())?;
    let beta_g2_y1 = Fq::from_str(&raw.vk_beta_2[1][1]).map_err(|_| "beta_g2_y1".to_string())?;
    let beta_g2 = G2Affine::new_unchecked(Fq2::new(beta_g2_x0, beta_g2_x1), Fq2::new(beta_g2_y0, beta_g2_y1));
    
    let gamma_g2_x0 = Fq::from_str(&raw.vk_gamma_2[0][0]).map_err(|_| "gamma_g2_x0".to_string())?;
    let gamma_g2_x1 = Fq::from_str(&raw.vk_gamma_2[0][1]).map_err(|_| "gamma_g2_x1".to_string())?;
    let gamma_g2_y0 = Fq::from_str(&raw.vk_gamma_2[1][0]).map_err(|_| "gamma_g2_y0".to_string())?;
    let gamma_g2_y1 = Fq::from_str(&raw.vk_gamma_2[1][1]).map_err(|_| "gamma_g2_y1".to_string())?;
    let gamma_g2 = G2Affine::new_unchecked(Fq2::new(gamma_g2_x0, gamma_g2_x1), Fq2::new(gamma_g2_y0, gamma_g2_y1));
    
    let delta_g2_x0 = Fq::from_str(&raw.vk_delta_2[0][0]).map_err(|_| "delta_g2_x0".to_string())?;
    let delta_g2_x1 = Fq::from_str(&raw.vk_delta_2[0][1]).map_err(|_| "delta_g2_x1".to_string())?;
    let delta_g2_y0 = Fq::from_str(&raw.vk_delta_2[1][0]).map_err(|_| "delta_g2_y0".to_string())?;
    let delta_g2_y1 = Fq::from_str(&raw.vk_delta_2[1][1]).map_err(|_| "delta_g2_y1".to_string())?;
    let delta_g2 = G2Affine::new_unchecked(Fq2::new(delta_g2_x0, delta_g2_x1), Fq2::new(delta_g2_y0, delta_g2_y1));
    
    let mut ic = Vec::new();
    for p in raw.IC.iter() {
        let x = Fq::from_str(&p[0]).map_err(|_| "ic_x".to_string())?;
        let y = Fq::from_str(&p[1]).map_err(|_| "ic_y".to_string())?;
        ic.push(G1Affine::new_unchecked(x, y));
    }
    
    Ok(VerifyingKey {
        alpha_g1,
        beta_g2,
        gamma_g2,
        delta_g2,
        gamma_abc_g1: ic,
    })
}

pub fn verify_proof(
    vk_bytes: &[u8],
    public_inputs: &[String],
    proof_json: &str,
) -> Result<bool, String> {
    let vk = VerifyingKey::<Bn254>::deserialize_compressed(&mut &vk_bytes[..])
        .map_err(|e| format!("Failed to deserialize verification key: {}", e))?;
        
    let proof = parse_proof(proof_json)?;
    
    let mut inputs = Vec::new();
    for input_str in public_inputs {
        let input_fr = Fr::from_str(input_str)
            .map_err(|_| format!("Failed to parse public input: {}", input_str))?;
        inputs.push(input_fr);
    }
    
    Groth16::<Bn254>::verify_proof(&vk, &proof, &inputs)
        .map_err(|e| format!("Verification error: {}", e))

}
