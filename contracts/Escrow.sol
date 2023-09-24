//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}

contract Escrow {

    /*********************** skeleton of the class **********************/

    //attributes for the contract 
    address public nftAddress;
    address payable public seller;
    address public inspector;
    address public lender;

    //  some modifier for the functions 
    modifier onlyBuyer(uint256 _nftID) {
        require(msg.sender == buyer[_nftID], "Only buyer can call this method");
        _;
    }

    modifier onlySeller() {
        require(msg.sender == seller, "Only seller can call this method");
        _;
    }
    
    modifier onlyInspector(){
        require(msg.sender == inspector , 'only inspector can call this method ');
        _;

    }
    // the constructor 
    constructor(
        address _nftAddress,
        address payable _seller,
        address _inspector,
        address _lender
    ) {
        nftAddress = _nftAddress;
        seller = _seller;
        inspector = _inspector;
        lender = _lender;
    }
    
    //mapping the address of the nft
    mapping(uint256 => bool) public isListed;
    mapping(uint256 => uint256) public purchasePrice;
    mapping(uint256 => uint256) public escrowAmount;
    mapping(uint256 => address) public buyer;
    mapping(uint256 => bool) public inspectionPassed;
    mapping(uint256 => mapping(address => bool)) public approval;

    //
    
    /******************* * Fucntions * **********************/

    // list the properties of an estate 
    function list(
        uint256 _nftID,
        address _buyer,
        uint256 _purchasePrice,
        uint256 _escrowAmount
    ) public payable onlySeller {
        // Transfer NFT from seller to this contract
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftID);

        isListed[_nftID] = true;
        purchasePrice[_nftID] = _purchasePrice;
        escrowAmount[_nftID] = _escrowAmount;
        buyer[_nftID] = _buyer;
    }

    // Put Under Contract (only buyer - payable escrow)
    function depositEarnest(uint256 _nftID) public payable onlyBuyer(_nftID) {
        require(msg.value >= escrowAmount[_nftID]);
    }

    //update the inspectation status (only inspector )
    function updateInspectionStatus(uint256 _nftID,bool _passed ) public onlyInspector 
        {
        inspectionPassed[_nftID] = _passed ;
    }

    //function to approve the sale of the nft 
    function approveSale(uint256 _nftID) public {
        approval[_nftID][msg.sender]=true;
    }
    
    // finalize the sale of the  NFT 
    function finalizeSale(uint256 _nftID) public {

        // test if the sale has passed the inspectation
        require(inspectionPassed[_nftID]);

        // test if the the buyer ,seller , inspector approved the sale
        require(approval[_nftID][buyer[_nftID]]);
        require(approval[_nftID][seller]);
        require(approval[_nftID][lender]);

        // test if the funds if they are real with the correct amount 
        require(address(this).balance >= purchasePrice[_nftID]);

        //the  properties or the estate is no more listed in the seller account 
        isListed[_nftID]=false;

        //test if the seller received the amount 
        (bool success,  ) = payable(seller).call{value:address(this).balance}("");
        require(success);

        // transfer the nft from the contract to the buyer - change the ownership of the nft 
        IERC721(nftAddress).transferFrom(address(this),buyer[_nftID], _nftID);

    }
    
    //Cancel the sale 
    function cancelSale(uint256 _nftID) public {
        if (inspectionPassed[_nftID] == false ){
            // send the ether amount to the buyer (return his money) 
            payable (buyer[_nftID]).transfer(address(this).balance);

        }else {
            // send the money to the seller 
            payable (seller).transfer(address(this).balance);
        }

    }

    /********************** general part **************************/
    
    //receive the eher 
    receive() external payable {}
    
    //get the balance of ether in the contract  
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
