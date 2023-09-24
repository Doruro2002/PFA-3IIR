// import the js library 
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

// Components
import Navigation from './components/Navigation';
import Search from './components/Search';
import Footer from './components/footer';
import Home from './components/Home';

// ABIs (contracts)
import RealEstate from './abis/RealEstate.json'
import Escrow from './abis/Escrow.json'

// Config
import config from './config.json';

function App() {
  
  // create state hooks  
  const [provider,setProvider] = useState(null) 
  const [account,setAccount] = useState(null) 
  const [escrow ,setEscrow] = useState(null)
  const [homes,setHomes] =useState([])
  const [home,setHome] = useState({})
  const [toggle,setToggle] = useState(false)

  // load Blockchain data to the local server 
  const loadBlockchainData = async ()=> {


    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider)

    // get the id of the chain (hardhat --31337)
    const network = await provider.getNetwork()

    // connect the real estate 
    
    const realEstate = new ethers.Contract(config[network.chainId].realEstate.address,RealEstate,provider)
    const totalSupply = await realEstate.totalSupply()

    // fetch all the metadata of the properties 
    const homes = []
    for (var i = 1; i <= totalSupply; i++) {
      const uri = await realEstate.tokenURI(i)
      const response = await fetch(uri)
      const metadata = await response.json()
      homes.push(metadata)
    }
    setHomes(homes)
    console.log(homes);
    // connect the escrow contract 
    const escrow = new ethers.Contract(config[network.chainId].escrow.address,Escrow,provider)
    setEscrow(escrow)

    // if the account has changed we should refresh the page automaticlly 
    window.ethereum.on('accountsChanged', async()=>{

      const accounts = await window.ethereum.request({method:'eth_requestAccounts'})

      const account = await ethers.utils.getAddress(accounts[0])

      setAccount(account);

    })

  }
  
  //now we call the loadblockchaindata function 
  useEffect(()=>{

    loadBlockchainData();
    
  },[])
  
  //toggle the home when card clicked 
  const togglePop = (home) =>{

    setHome(home)

    toggle ? setToggle(false) : setToggle(true)

  }

  //index page 
  return (
    <div>
    
      {/* import the navigation component  */}
      <Navigation account={account} setAccount={setAccount} />

      {/* import the search component */}
      {/* header  */}
      <div id="title" class="slide header">

        <h1>Join our online community!</h1>

      </div>
            
      {/* Home section */}
      <div className='cards__section'>

        <h3 className='titro' >Get Home Recommendations</h3>
        
        <hr/>
       
         <div className='cards'>
            {/* metadata */}
            {homes.map((home, index) => (

              <div class="nft" key={index} onClick={ () => togglePop(home)}>

                <div class='main'>

                  <img class='tokenImage' src={home.image} alt="NFT" />

                  <h2>{home.name}</h2>

                  <p class='description'>{home.address}</p>

                  <div class='tokenInfo'>

                    <div class="price">

                      <ins>◘</ins>

                      <p>{home.attributes[0].value} ETH</p>

                    </div>

                    <div class="duration">

                      <ins>◷</ins>

                      <p>{home.attributes[5].value}</p>

                    </div>

                  </div>

                  <hr />
                  <div class='creator'>
                    
                    <div class='wrapper'>

                      <img src={home.attributes[7].value} alt="Creator" />
                    </div>

                    <p><ins>constructed by</ins>{home.attributes[6].value}</p>

                  </div>

                </div>

              </div>

          ))}
         </div>
      </div>

      {/* if card is clicked */}
      {toggle && (
        <Home home={home} provider={provider} account={account} escrow={escrow} togglePop={togglePop} />
      )}
      
    </div>
  );
}

export default App;
