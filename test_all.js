#!/usr/bin/env node

const fs = require("fs");
const { buildEddsa, buildMimc7 } = require("circomlibjs");

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

async function main() {
  console.log("\n" + "=".repeat(80));
  console.log("ZK-SNARK VOTING SYSTEM - AUTOMATED TESTING");
  console.log("=".repeat(80) + "\n");

  // Load test scenarios
  const scenariosFile = fs.readFileSync("test_scenarios.json", "utf8");
  const config = JSON.parse(scenariosFile);

  console.log(`${colors.cyan}Filtering Criteria:${colors.reset}`);
  console.log(`   Allowed City: ${config.filteringCriteria.allowedCityName} (${config.filteringCriteria.allowedCity})`);
  console.log(`   Allowed Region: ${config.filteringCriteria.allowedRegionName} (${config.filteringCriteria.allowedRegion})`);
  console.log(`   Min Birth Date: ${config.filteringCriteria.minBirthDate} (>= 18 years old)`);
  console.log("");

  // Initialize crypto libraries
  console.log("Initializing cryptographic libraries...");
  const eddsa = await buildEddsa();
  const mimc7 = await buildMimc7();
  console.log("   EdDSA and MiMC7 ready\n");

  // Generate authority keypair
  const privKeyAuthority = Buffer.from(config.authority.privateKey, "hex");
  const pubKeyAuthority = eddsa.prv2pub(privKeyAuthority);

  console.log(`${colors.cyan}Authority Public Key:${colors.reset}`);
  console.log(`   pkAx: ${eddsa.F.toString(pubKeyAuthority[0])}`);
  console.log(`   pkAy: ${eddsa.F.toString(pubKeyAuthority[1])}\n`);

  // Test results summary
  const results = {
    total: config.scenarios.length,
    passed: 0,
    failed: 0,
    details: []
  };

  // Process each scenario
  for (const scenario of config.scenarios) {
    console.log("─".repeat(80));
    console.log(`\n${colors.yellow}Test #${scenario.id}: ${scenario.name}${colors.reset}`);
    console.log(`Expected: ${scenario.expectedResult === "PASS" ? colors.green + "PASS" : colors.red + "FAIL"}${colors.reset}`);
    if (scenario.failReason) {
      console.log(`Reason: ${scenario.failReason}`);
    }
    console.log("");

    try {
      // Generate voter keypair (deterministic based on scenario ID)
      const hexStr = scenario.id.toString(16).padStart(2, '0').repeat(32);
      const privKeyVC = Buffer.from(hexStr, "hex");
      const pubKeyVC = eddsa.prv2pub(privKeyVC);

      // Hash VC attributes
      const vcName = BigInt(scenario.voter.name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) * 1000000n;
      const vcSurname = BigInt(scenario.voter.surname.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) * 2000000n;
      const vcAddress = BigInt(scenario.voter.address.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) * 3000000n;
      const vcCity = BigInt(scenario.voter.city);
      const vcDistrict = BigInt(scenario.voter.district);
      const vcRegion = BigInt(scenario.voter.region);
      const vcCountry = BigInt(scenario.voter.country);
      const vcDOB = BigInt(scenario.voter.dob);

      // Create message hash for signature
      const pkVCx = eddsa.F.e(pubKeyVC[0]);
      const pkVCy = eddsa.F.e(pubKeyVC[1]);
      
      const sum = vcName + vcSurname + vcAddress + vcCity + vcDistrict + vcRegion + vcCountry + vcDOB;
      const msgHash = mimc7.hash(sum, pkVCx);
      const msgHashForSig = eddsa.F.e(msgHash);

      // Authority signs the VC
      const signature = eddsa.signMiMC(privKeyAuthority, msgHashForSig);

      // VDF commitment
      const voteChoice = BigInt(scenario.vote);
      const vdfInput = BigInt(Math.floor(Math.random() * 1e18));
      const vdfCommitmentRaw = mimc7.hash(voteChoice + vdfInput, BigInt(scenario.vdfIterations));
      const vdfCommitment = mimc7.F.toString(vdfCommitmentRaw);

      // Build input.json
      const inputs = {
        // Private inputs
        vcName: vcName.toString(),
        vcSurname: vcSurname.toString(),
        vcAddress: vcAddress.toString(),
        vcCity: vcCity.toString(),
        vcDistrict: vcDistrict.toString(),
        vcRegion: vcRegion.toString(),
        vcCountry: vcCountry.toString(),
        vcDOB: vcDOB.toString(),
        skVC: eddsa.F.toString(eddsa.pruneBuffer(privKeyVC)),
        voteChoice: voteChoice.toString(),
        vdfInput: vdfInput.toString(),
        vdfIterations: scenario.vdfIterations.toString(),
        sigR8x: eddsa.F.toString(signature.R8[0]),
        sigR8y: eddsa.F.toString(signature.R8[1]),
        sigS: signature.S.toString(),

        // Public inputs
        pkAx: eddsa.F.toString(pubKeyAuthority[0]),
        pkAy: eddsa.F.toString(pubKeyAuthority[1]),
        pkVCx: eddsa.F.toString(pubKeyVC[0]),
        pkVCy: eddsa.F.toString(pubKeyVC[1]),
        vdfCommitment: vdfCommitment.toString(),
        allowedCity: config.filteringCriteria.allowedCity,
        allowedRegion: config.filteringCriteria.allowedRegion,
        minBirthDate: config.filteringCriteria.minBirthDate
      };

      // Save input file
      const inputFileName = `test_input_${scenario.id}.json`;
      fs.writeFileSync(inputFileName, JSON.stringify(inputs, null, 2));

      console.log(`${colors.blue}Voter Details:${colors.reset}`);
      console.log(`   Name: ${scenario.voter.name} ${scenario.voter.surname}`);
      console.log(`   Location: ${scenario.voter.cityName}, ${scenario.voter.regionName}`);
      console.log(`   DOB: ${scenario.voter.dobReadable}`);
      console.log(`   Vote Choice: ${scenario.vote}`);
      console.log(`   Input file: ${inputFileName}\n`);

      // Try to generate witness and proof
      console.log("Generating witness...");
      const { execSync } = require("child_process");
      
      try {
        execSync(
          `node circuit_js/generate_witness.js circuit_js/circuit.wasm ${inputFileName} test_witness_${scenario.id}.wtns`,
          { stdio: "pipe" }
        );
        console.log("   Witness generated successfully");

        console.log("Generating proof...");
        execSync(
          `snarkjs groth16 prove circuit_final.zkey test_witness_${scenario.id}.wtns test_proof_${scenario.id}.json test_public_${scenario.id}.json`,
          { stdio: "pipe" }
        );
        console.log("   Proof generated successfully");

        console.log("Verifying proof...");
        const verifyOutput = execSync(
          `snarkjs groth16 verify verification_key.json test_public_${scenario.id}.json test_proof_${scenario.id}.json`,
          { encoding: "utf8" }
        );

        if (verifyOutput.includes("OK")) {
          console.log(`   ${colors.green}Proof verification: OK${colors.reset}`);
          
          // Check if this matches expected result
          if (scenario.expectedResult === "PASS") {
            console.log(`\n${colors.green}TEST PASSED (as expected)${colors.reset}`);
            results.passed++;
            results.details.push({ id: scenario.id, name: scenario.name, result: "PASS", expected: true });
          } else {
            console.log(`\n${colors.red}TEST FAILED (expected to fail but passed!)${colors.reset}`);
            results.failed++;
            results.details.push({ id: scenario.id, name: scenario.name, result: "PASS", expected: false });
          }
        } else {
          throw new Error("Verification failed");
        }

      } catch (error) {
        // Witness or proof generation failed
        console.log(`   ${colors.red}Error: ${error.message.split("\n")[0]}${colors.reset}`);
        
        if (scenario.expectedResult === "FAIL") {
          console.log(`\n${colors.green}TEST PASSED (failed as expected)${colors.reset}`);
          results.passed++;
          results.details.push({ id: scenario.id, name: scenario.name, result: "FAIL", expected: true });
        } else {
          console.log(`\n${colors.red}TEST FAILED (expected to pass but failed!)${colors.reset}`);
          results.failed++;
          results.details.push({ id: scenario.id, name: scenario.name, result: "FAIL", expected: false });
        }
      }

    } catch (error) {
      console.log(`${colors.red}Unexpected error: ${error.message}${colors.reset}`);
      results.failed++;
      results.details.push({ id: scenario.id, name: scenario.name, result: "ERROR", expected: false });
    }

    console.log("");
  }

  // Print summary
  console.log("=".repeat(80));
  console.log(`\n${colors.cyan}TEST SUMMARY${colors.reset}\n`);
  console.log(`Total tests: ${results.total}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log("");

  // Print details
  console.log("Details:");
  for (const detail of results.details) {
    const status = detail.expected ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`;
    console.log(`  ${status} Test #${detail.id}: ${detail.name}`);
  }

  console.log("\n" + "=".repeat(80) + "\n");

  // Keep files for debugging
  console.log("Test files saved (test_input_*.json, test_witness_*.wtns, etc.)\n");

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch(console.error);
