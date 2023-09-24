import logo from '../assets/logo.svg';

const Navigation = ({ account, setAccount }) => {

    // get the account state with the connect handler function 
    const connectHandler = async ()=>{
        // get the account address  from metamask with a request
        const accounts = await window.ethereum.request({method:'eth_requestAccounts'})
        setAccount(accounts[0])

        
        
    }

    // the navbar DOM
    return(
        <nav>
        <ul className='nav__links'>
            <li><a href="#">Buy</a></li>
            <li><a href="#">Rent</a></li>
            <li><a href="#">Sell</a></li>
        </ul>

        <div className='nav__brand'>
            <img src={logo} alt="Logo" />
            <h1>Millow</h1>
        </div>

        {
            // if the found the account (the client is connected )
            
            account ? (
                <button 
                    type = "button"
                    className='nav__connect'    
                >
                    {account.slice(0,6)+'....'+account.slice(38,42)}
                </button>
            )
            // if we didnt find  the account address (the client is not connected )
            :(
            <button 
                type = "button"
                className='nav__connect'    
                onClick={connectHandler}
            >
                Connect
            </button>
            )
        }
        </nav>
    )
}

export default Navigation;
 