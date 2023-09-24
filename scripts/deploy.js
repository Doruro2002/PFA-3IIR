const hre = require("hardhat");

// convert ana amount or number to wei 
const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

async function main() {
   // Setup accounts
   [buyer, seller, inspector, lender] = await ethers.getSigners()

   // Deploy Real Estate
   const RealEstate = await ethers.getContractFactory('RealEstate')
   realEstate = await RealEstate.deploy()

  // if not deployed then deployed or retreive the old one 
   await realEstate.deployed()

  //minting 3 properties 
  for (let i = 0; i < 24; i++) {
    console.log(`https://ipfs.io/ipfs/Qmdvu2U2m5egTGNubvJB5Mru5Q3nNFmasR4egqoEd1DPsk/${i+1}.json -- is minted`);
    const transaction = await realEstate.connect(seller).mint(`https://ipfs.io/ipfs/Qmdvu2U2m5egTGNubvJB5Mru5Q3nNFmasR4egqoEd1DPsk/${i+1}.json `)
    await transaction.wait()
  }

  // deploy escrow contract
  const Escrow = await ethers.getContractFactory('Escrow')
  const escrow = await Escrow.deploy(
    realEstate.address,
    seller.address,
    inspector.address,
    lender.address
  )
  await escrow.deployed()
  //show the addresses of the contract
  console.log(`escrow contract address: ${escrow.address}`)
  console.log(`realEstate contract address:${realEstate.address}`)
  // approve all the properties (3 properties )
  for (let i = 0; i < 24; i++) {
    // Approve properties...
    let transaction = await realEstate.connect(seller).approve(escrow.address, i + 1)
    await transaction.wait()
    console.log(`https://ipfs.io/ipfs/Qmdvu2U2m5egTGNubvJB5Mru5Q3nNFmasR4egqoEd1DPsk/${i+1}.json -- is approved`);
  }
  
  //list the 3 properties 
  // Listing properties...
  const min = 10; 
  const max = 20; 
  const numberOfTimes = 24; 
  const randomNumbers = [];

  for (let i = 0; i < numberOfTimes; i++) {
    const randomNumber = Math.random() * (max - min + 1)+ min;
    randomNumbers.push(randomNumber);
    
  }

  for (let i = 0; i < numberOfTimes; i++) {
    
    const transaction = await escrow.connect(seller).list(i+1, buyer.address, tokens(15), tokens(10));
    await transaction.wait();
    console.log(`https://ipfs.io/ipfs/Qmdvu2U2m5egTGNubvJB5Mru5Q3nNFmasR4egqoEd1DPsk/${i+1}.json -- is created`);
  }
  
  console.log('the contract is deployed');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
