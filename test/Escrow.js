
// import the testing  libraries
const { expect } = require('chai');
const { ethers } = require('hardhat');

// convert ana amount or number to wei 
const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

//suite of test for the contract 
describe('Escrow', () => {
    
    // declaring the acc in this sale
    let buyer, seller, inspector, lender

    let realEstate, escrow

    //stuff to execute before starting this suite of test 
    beforeEach(async () => {

        // Setup accounts
        [buyer, seller, inspector, lender] = await ethers.getSigners()

        // Deploy Real Estate
        const RealEstate = await ethers.getContractFactory('RealEstate')
        realEstate = await RealEstate.deploy()

        // Mint the nft with the ipfs protocol
        let transaction = await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS")
        await transaction.wait()

        // deploy the escrow contract 
        const Escrow = await ethers.getContractFactory('Escrow')
        escrow = await Escrow.deploy(
            realEstate.address,
            seller.address,
            inspector.address,
            lender.address
        )

        // Approve the seller 
        transaction = await realEstate.connect(seller).approve(escrow.address, 1)
        await transaction.wait()

        // List Property
        transaction = await escrow.connect(seller).list(1, buyer.address, tokens(10), tokens(5))
        await transaction.wait()
    })
 
    // test the attributes of escrow contract
    describe('Deployment', () => {

        it('Returns NFT address', async () => {
            const result = await escrow.nftAddress()
            expect(result).to.be.equal(realEstate.address)
        })

        it('Returns seller', async () => {
            const result = await escrow.seller()
            expect(result).to.be.equal(seller.address)
        })

        it('Returns inspector', async () => {
            const result = await escrow.inspector()
            expect(result).to.be.equal(inspector.address)
        })

        it('Returns lender', async () => {
            const result = await escrow.lender()
            expect(result).to.be.equal(lender.address)
        })
    })

    // test if the properties were correctly listed  
    describe('Listing', () => {
        
        it('Updates as listed', async () => {
            const result = await escrow.isListed(1)
            expect(result).to.be.equal(true)
        })

        it('Returns buyer', async () => {
            const result = await escrow.buyer(1)
            expect(result).to.be.equal(buyer.address)
        })

        it('Returns purchase price', async () => {
            const result = await escrow.purchasePrice(1)
            expect(result).to.be.equal(tokens(10))
        })

        it('Returns escrow amount', async () => {
            const result = await escrow.escrowAmount(1)
            expect(result).to.be.equal(tokens(5))
        })

        it('Updates ownership', async () => {
            expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address)
        })
    })

    // the buyer deposits the amount or more than the price 
    describe('Deposits', () => {
        // he first send the amount to the escrow contract 
        beforeEach(async () => {
            const transaction = await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) })
            await transaction.wait()
        })
        //in his wallet the rest from the transaction should be 5 ether / 5000000000000000000 wei
        it('Updates contract balance', async () => {
            const result = await escrow.getBalance()
            expect(result).to.be.equal(tokens(5))
        })

        //  it('get the balance of the buyer acc', async()=>{
        //     const result = await  escrow.getBalance()
        //     // transform wei to ether - show the amount in the wallet of the buyer after this transaction 
        //     // console.log('the amount of ether is :');
        //     // const price = ethers.utils.formatUnits(result , 'ether')
        //     // console.log(price )
        //     expect(result).to.be.equal(tokens(5))
        //  })
    })

    // test the inspection if passed 
    describe('Inspection',  ()=>{
        it('Update inspection status ', async ()=>{
            const transaction = await escrow.connect(inspector).updateInspectionStatus(1,true)
            await transaction.wait()
            const result = await escrow.inspectionPassed(1)
            expect(result).to.be.equal(true)
        })

    })
    //  test if the sale is confirmed 
    describe('Approve  ', ()=>{
        it('update the approval status', async ()=>{

            // approve sale for the buyer
            let transaction = await escrow.connect(buyer).approveSale(1)
            await transaction.wait()
            
            // approve sale for the seller 
            transaction = await escrow.connect(seller).approveSale(1)
            await transaction.wait()
            
            // approve sale for the lender
            transaction = await escrow.connect(lender).approveSale(1)
            await transaction.wait()

            expect( await escrow.approval(1,buyer.address)).to.be.equal(true)
            expect( await escrow.approval(1,seller.address)).to.be.equal(true)
            expect( await escrow.approval(1,lender.address)).to.be.equal(true)
        })

    })
    
    //  test if the sale is confirmed 
    describe('Sale', () => {
        beforeEach(async () => {
            //deposit the money
            let transaction = await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) })
            await transaction.wait()
            
            // inspection passed 
            transaction = await escrow.connect(inspector).updateInspectionStatus(1, true)
            await transaction.wait()

            // appprove the sale by the buyer lender seller
            transaction = await escrow.connect(buyer).approveSale(1)
            await transaction.wait()

            transaction = await escrow.connect(seller).approveSale(1)
            await transaction.wait()

            transaction = await escrow.connect(lender).approveSale(1)
            await transaction.wait()

            // send fees to the contract by the lender (pay the lender)
            await lender.sendTransaction({ to: escrow.address, value: tokens(5) })

            // finalize the transaction 
            transaction = await escrow.connect(seller).finalizeSale(1)
            await transaction.wait()
        })


        // check the balance of the contract
        it('Updates contract balance', async () => {
            const result = await escrow.getBalance()
            expect(result).to.be.equal(tokens(0))
        })

        // check if the ownership of the nft has been transfered to the buyer 
        it('Updates ownership', async () => {
            expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address)
        })
        
    })



    /*==============================================================================================*/



    //test the cancel ssale function 
    // describe('cancel', () => {
    //     beforeEach(async () => {
    //         //deposit the money
    //         let transaction = await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) })
    //         await transaction.wait()
            
    //         // inspection passed 
    //         transaction = await escrow.connect(inspector).updateInspectionStatus(1, true)
    //         await transaction.wait()

    //         // appprove the sale by the buyer lender seller
    //         transaction = await escrow.connect(buyer).approveSale(1)
    //         await transaction.wait()

    //         transaction = await escrow.connect(seller).approveSale(1)
    //         await transaction.wait()

    //         transaction = await escrow.connect(lender).approveSale(1)
    //         await transaction.wait()

    //         // send fees to the contract by the lender (pay the lender)
    //         await lender.sendTransaction({ to: escrow.address, value: tokens(5) })

    //         // finalize the transaction 
    //         transaction = await escrow.connect(seller).cancelSale(1)
    //         await transaction.wait()
    //     })


    //     // check the balance of the contract
    //     it('Updates ownership', async () => {
    //         expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address)
    //     })
        
        
        
    // })

})