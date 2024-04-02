The OKLottery contract is a lottery smart contract that allows users to participate by buying tickets with OK Tokens (IERC20). Here's a breakdown of its functionalities and how you can interact with it:

Functionality:
Ticket Buying: Users can buy tickets by calling the buyTickets function. They specify the number of tickets they want to buy, and the corresponding amount of OK Tokens is transferred from their address to the contract. Tickets are sold at the ticketPrice specified in the contract.

Lottery Management: The contract manages the lottery process. It has cooldown and lottery durations, and it automatically starts a new lottery after the cooldown period ends. Once the lottery ends, winners are selected, and rewards are distributed.

Winner Selection: Winners are selected randomly among the participants. The contract uses a pseudo-random number generation algorithm based on various unpredictable elements to improve on-chain randomness.

Prize Distribution: Winners receive their prizes from the prize pool. The contract also allocates percentages of the prize pool for fees, ender rewards, and reserve for the next lottery.

Administration: The contract includes various administrative functions that allow the owner to manage parameters such as lottery mode, ticket price, ticket limit per user, fee taker addresses, prize distribution percentages, cooldown duration, lottery duration, and emergency refund.

Interactions:
Buying Tickets: Users can call the buyTickets function to participate in the lottery by buying tickets. They need to specify the number of tickets they want to buy.

Ending Lottery: If the lottery is not active and the current time is beyond the cooldown period, users or allowed contracts can call the automatedLotteryCheck function to end the lottery and select winners.

Managing Lottery Parameters: Only the owner can call functions to manage lottery parameters such as setting lottery mode, ticket price, ticket limit per user, fee taker addresses, prize distribution percentages, cooldown duration, and lottery duration.

Emergency Refunds: In case of emergencies, the owner can enable emergency refunds to refund the participants' ticket costs. This feature can be managed using the enableEmergencyRefund, refundParticipantsInBatch, and disableEmergencyRefund functions.

Frontend Variables:
To implement a frontend for interacting with this contract, you would typically need to read and display the following contract variables:

lotteryActive: Indicates whether a lottery is currently active.
nextLotteryStartTime: Timestamp indicating when the next lottery will start.
lotteryEndTime: Timestamp indicating when the current lottery will end.
ticketPrice: The price of each ticket in OK Tokens.
participants: Array containing addresses of participants in the current lottery.
totalTicketsSold: Total number of tickets sold in the current lottery.
lastWinner: Address of the last winner.
lastWinnerPrize: Prize amount won by the last winner.
Other variables related to lottery parameters and settings, such as cooldownDuration, lotteryDuration, ticketLimitPerUser, feeTakerFeePercentage, feeTaker2FeePercentage, etc.