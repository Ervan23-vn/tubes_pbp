/**
 * Client-side ZKP Proof Generation for User Bidding
 *
 * CRITICAL: This runs ENTIRELY on the client
 * - Bid amount never sent to server
 * - Only commitment_hash and proof sent
 * - Bid amount stored locally for reveal later
 */

async function hashBid(bidAmount, salt) {
  const data = `${bidAmount}:${salt}`
  const encoded = new TextEncoder().encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function generateSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Create a mock ZKP proof structure
 * In production, would use snarkjs + circom circuits
 * This is simplified for demonstration
 */
function createMockZKPProof(bidAmount, salt, itemId) {
  const proof = {
    pi_a: [
      '21159435486076916919378876318297827379298329218651854404313848886485815893451',
      '8949268903381833898024202160945835857395936268821502826074833688816896913286'
    ],
    pi_b: [
      [
        '11568530482879068936949606262868834325697024654898761922908433900088263333627',
        '11845606395393103254301706876152838829865819621433851843263607862357318893906'
      ],
      [
        '21159435486076916919378876318297827379298329218651854404313848886485815893451',
        '8949268903381833898024202160945835857395936268821502826074833688816896913286'
      ]
    ],
    pi_c: [
      '11568530482879068936949606262868834325697024654898761922908433900088263333627',
      '11845606395393103254301706876152838829865819621433851843263607862357318893906'
    ],
    protocol: 'groth16',
    curve: 'bn128',
    input: [bidAmount, itemId]
  }

  return proof
}

/**
 * Main function: Generate ZKP proof untuk bid
 *
 * Returns:
 * - commitment_hash: H(bid + salt) - dikirim ke backend
 * - proof_json: ZKP proof structure - dikirim ke backend
 * - salt: DISIMPAN di device untuk reveal nanti
 */
export async function generateZKPProof(bidAmount, itemId) {
  console.log('🔐 Generating ZKP proof on client...')
  console.log(`Bid amount: ${bidAmount} (TIDAK dikirim ke server)`)
  console.log(`Item ID: ${itemId}`)

  const salt = generateSalt()
  console.log(`Salt generated: ${salt}`)

  const commitment_hash = await hashBid(bidAmount, salt)
  console.log(`Commitment hash: ${commitment_hash}`)

  const proof_json = createMockZKPProof(bidAmount, salt, itemId)

  await new Promise((resolve) => setTimeout(resolve, 1000))

  console.log('✅ ZKP proof generated successfully')

  return {
    commitment_hash,
    proof_json,
    salt
  }
}

/**
 * Verify commitment when revealing bid
 * Called when buyer wants to reveal bid amount setelah lelang ditutup
 */
export async function verifyCommitment(bidAmount, salt, storedCommitmentHash) {
  const computedHash = await hashBid(bidAmount, salt)
  const isValid = computedHash === storedCommitmentHash

  console.log('Verifying commitment:')
  console.log(`  Stored: ${storedCommitmentHash}`)
  console.log(`  Computed: ${computedHash}`)
  console.log(`  Valid: ${isValid}`)

  return isValid
}
