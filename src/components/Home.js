import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

import close from '../assets/close.svg';

const Home = ({ home, provider,account, escrow, togglePop }) => {

    const [hasBought,setHasBought] = useState(false)
    const [hasLended,setHasLended] = useState(false)
    const [hasInspected,setHasInspected] = useState(false)
    const [hasSold,setHasSold] = useState(false)

    const [buyer,setBuyer] = useState(null)
    const [inspector,setInspector] = useState(null)
    const [lender,setLender] = useState(null)
    const [seller,setSeller] = useState(null)
    const [owner,setOwner] = useState(null)

    const fetchOwner = async () => {
        if (await escrow.isListed(home.id)) return

        const owner = await escrow.buyer(home.id)
        setOwner(owner)
    }

    // get the buyer of the house
    const fetchDetails = async() =>{

        // Buyer
        const buyer = await escrow.buyer(home.id)
        setBuyer(buyer)

        const hasBought = await escrow.approval(home.id, buyer)
        setHasBought(hasBought)

        // Seller

        const seller = await escrow.seller()
        setSeller(seller)

        const hasSold = await escrow.approval(home.id, seller)
        setHasSold(hasSold)

        // Lender

        const lender = await escrow.lender()
        setLender(lender)

        const hasLended = await escrow.approval(home.id, lender)
        setHasLended(hasLended)

        // Inspector

        const inspector = await escrow.inspector()
        setInspector(inspector)

        const hasInspected = await escrow.inspectionPassed(home.id)
        setHasInspected(hasInspected)

    }
    
    // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    // --------------------------HANDLERS---------------------------------------
    // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    
    const buyHandler = async () => {
        const escrowAmount = await escrow.escrowAmount(home.id)
        const signer = await provider.getSigner()

        // Buyer deposit earnest
        let transaction = await escrow.connect(signer).depositEarnest(home.id, { value: escrowAmount })
        await transaction.wait()

        // Buyer approves...
        transaction = await escrow.connect(signer).approveSale(home.id)
        await transaction.wait()

        setHasBought(true)
    }

    const inspectHandler = async () => {
        const signer = await provider.getSigner()

        // Inspector updates status
        const transaction = await escrow.connect(signer).updateInspectionStatus(home.id, true)
        await transaction.wait()

        setHasInspected(true)
        console.log("inspect");
    }

    const lendHandler = async () => {
        const signer = await provider.getSigner()

        // Lender approves...
        const transaction = await escrow.connect(signer).approveSale(home.id)
        await transaction.wait()

        // Lender sends funds to contract...
        const lendAmount = (await escrow.purchasePrice(home.id) - await escrow.escrowAmount(home.id))
        await signer.sendTransaction({ to: escrow.address, value: lendAmount.toString(), gasLimit: 60000 })

        setHasLended(true)
        console.log("lend");
    }

    const sellHandler = async () => {
        const signer = await provider.getSigner()

        // Seller approves...
        let transaction = await escrow.connect(signer).approveSale(home.id)
        await transaction.wait()

        // Seller finalize...
        transaction = await escrow.connect(signer).finalizeSale(home.id)
        await transaction.wait()

        setHasSold(true)
        console.log("sell");
    }

    // call the function when has has solde change the state
    useEffect(() => {
        fetchDetails()
        fetchOwner()
    }, [hasSold])

    return (
        <div   className="home">
            <div className='home__details'>

                {/* image overview */}
                <div className="home__image">
                        <img src={home.image} alt="Home" />
                </div>
                {/* home metadata */}
                <div  className='home__overview'>
                    <h1 >{home.name}</h1>   
                    <p>{home.address}</p>
                    
                    

                    

                    <div>
                        
                        
                        

                        

                        <h2>Overview</h2>
                        <p>
                            {home.description}
                        </p>

                        <hr/>

                        {/* details list */}
                        <h2>Facts and features </h2>

                            <ul>
                                {home.attributes.map((attribute,index) => (
                                    <li key={index}> <strong>{attribute.trait_type}</strong> : {attribute.value}</li>
                                ))}
                            </ul>
                    </div>
                    {/* check if its him the owner or kust a buyer  */}
                    {owner ? (
                        <div className='home__owned'>
                            Owned by {owner.slice(0, 6) + '...' + owner.slice(38, 42)}
                        </div>
                    ) : (
                        <div>
                            {(account === inspector) ? (
                                <button className='home__buy' onClick={inspectHandler} disabled={hasInspected}>
                                    Approve Inspection
                                </button>
                            ) : (account === lender) ? (
                                <button className='home__buy' onClick={lendHandler} disabled={hasLended}>
                                    Approve & Lend
                                </button>
                            ) : (account === seller) ? (
                                <button className='home__buy' onClick={sellHandler} disabled={hasSold}>
                                    Approve & Sell
                                </button>
                            ) : (
                                <button className='home__buy' onClick={buyHandler} disabled={hasBought}>
                                    Buy
                                </button>
                            )}

                        </div>
                    )}
                </div>
                {/* close pop */}
                <button onClick={togglePop} className='home__close'>
                    <img src={close} alt='close'/>
                </button>

            </div>
        </div>
    );
}

export default Home;
