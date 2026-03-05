const c = document.getElementById('canvas');
const ctx = c.getContext('2d');
c.addEventListener('click', handleCanvasClick);

// Variables for background music and sound effects
let backgroundMusic = new Audio('audio/casino-jazz-music-copyright-free.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.2;

let buttonClickSound = new Audio('audio/button-click-sound-nodelay.mp3');
buttonClickSound.volume = 0.5;

let winSound = new Audio('audio/winning-sound.mp3');
winSound.volume = 0.7;

let coinSound = new Audio('audio/coins-sound.mp3');
coinSound.volume = 0.7;

let loseSound = new Audio('audio/losing-sound.mp3');
loseSound.volume = 0.7;

let tiedSound = new Audio('audio/tied-sound.mp3');
tiedSound.volume = 0.7;

// Storage for all card names in the deck (excluding joker cards cuz Blackjack doesn't use jokers)
let cardNames = [
    '2C', '3C', '4C', '5C', '6C', '7C', '8C', '9C', '10C', 'JC', 'QC', 'KC', 'AC',
    '2D', '3D', '4D', '5D', '6D', '7D', '8D', '9D', '10D', 'JD', 'QD', 'KD', 'AD',
    '2H', '3H', '4H', '5H', '6H', '7H', '8H', '9H', '10H', 'JH', 'QH', 'KH', 'AH',
    '2S', '3S', '4S', '5S', '6S', '7S', '8S', '9S', '10S', 'JS', 'QS', 'KS', 'AS'
];

// Single object to hold all card images as keys instead of having 52 separate objects, which may cause lag
let cardImages = {};

let deck = [];

let playerHand = [];

let dealerHand = [];

// Variables for currency and betting feature
let playerBalance = 1000;
let currentBet = 0;
let bettingMessage = '';

let highestBalance = 1000;

// Preload all card images into the cardImages object to prevent any loading delays, assigning a key (cardName) and value (image path) for each card
function preloadCards() {
    for (let i = 0; i < cardNames.length; i++) {
        let cardName = cardNames[i];
        let img = new Image();
        img.src = 'cards/' + cardName + '.png';
        cardImages[cardName] = img;
    }
}

preloadCards();

// Important to hold the status of the current screen (mainly to prevent complications with the buttons, see handleCanvasClick function)
let currentScreen = 'home';

// Object class logo/title template for the logo/title of the game 
class Logo {
    constructor(logoValue, logoColor, logoX, logoY, logoFont) {
        this.logoValue = logoValue;
        this.logoColor = logoColor;
        this.logoX = logoX;
        this.logoY = logoY;
        this.logoFont = logoFont;
    }

    drawLogo() {
        ctx.save();
        ctx.fillStyle = this.logoColor;
        ctx.font = this.logoFont;

        // centers the text horizontally and vertically
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Add a glow effect around the logo to make it look cool and match the casino vibe
        ctx.shadowColor = 'rgba(255, 215, 0, 0.7)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.fillText(this.logoValue, this.logoX, this.logoY);
        ctx.restore();
    }
}

let gameLogo = new Logo('Blackjack', '#FFD700', c.width / 2, 200, '100px Times New Roman');

gameLogo.drawLogo();

// Object class button template for ALL buttons in the game (probably the most important piece of code in the whole game)
class Button {
    constructor(buttonX, buttonY, buttonWidth, buttonHeight, buttonValue, buttonColor, onClick) {
        this.buttonX = buttonX;
        this.buttonY = buttonY;
        this.buttonWidth = buttonWidth;
        this.buttonHeight = buttonHeight;
        this.buttonValue = buttonValue;
        this.buttonColor = buttonColor;

        // This will hold a function
        this.onClick = onClick;
    }

    drawButton() {
        ctx.save();

        ctx.shadowColor = 'rgba(10, 31, 68, 0.6)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        ctx.fillStyle = this.buttonColor;
        ctx.fillRect(this.buttonX, this.buttonY, this.buttonWidth, this.buttonHeight);
        ctx.strokeStyle = 'rgba(10, 31, 68, 1)';
        ctx.strokeRect(this.buttonX, this.buttonY, this.buttonWidth, this.buttonHeight);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '25px Times New Roman';

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText(this.buttonValue, this.buttonX + this.buttonWidth / 2, this.buttonY + this.buttonHeight / 2);
        ctx.restore();
    }

    // Important for detecting if a mouse click happens within the button - if the click happens inside the button horizontally AND vertically, then it returns true, otherwise it returns false (also needed for handleCanvasClick function)
    clickIsInside(mouseX, mouseY) {
        let insideX = mouseX > this.buttonX && mouseX < this.buttonX + this.buttonWidth;
        let insideY = mouseY > this.buttonY && mouseY < this.buttonY + this.buttonHeight;
        if (insideX && insideY) {
            return true;
        } else {
            return false;
        }
    }
}

let playButton = new Button(
    380, 380, 140, 60, 'Play', '#2FBDFD',
    function () {
        startBettingScreen();
    }
);

playButton.drawButton();

let tutorialButton = new Button(
    380, 450, 140, 60, 'Tutorial', '#2FBDFD',
    function () {
        startTutorial();
    }
);

tutorialButton.drawButton();

// This button will be drawn in startTutorial function 
let endTutorialButton = new Button(
    350, 450, 180, 60, 'Finish Tutorial', '#2FBDFD',
    function () {
        returnHome();
    }
);

// This button will be drawn in startGame function 
let hitButton = new Button(
    120, 320, 140, 60, 'Hit', '#2FBDFD',
    function () {
        drawCard();
    }
);

// This button will be drawn in startGame function too
let standButton = new Button(
    620, 320, 140, 60, 'Stand', '#2FBDFD',
    function () {
        endTurn();
    }
);

// This button will be drawn in the endTurn function
let playAgainButton = new Button(
    350, 380, 180, 60, 'Play Again', '#2FBDFD',
    function () {
        resetPlayerCurrency();
        returnHome();
    }
);

// This button will be drawn in the endTurn function
let continuePlayingButton = new Button(
    350, 380, 200, 60, 'Continue Playing', '#2FBDFD',
    function () {
        startBettingScreen();
    }
);

// Betting/currency feature buttons, they will be drawn in the drawBettingScreenCanvas function
let betUpButton = new Button(
    500, 330, 80, 50, '+', '#2FBDFD',
    function () {
        betUpValidation();
    }
);

let betDownButton = new Button(
    320, 330, 80, 50, '-', '#2FBDFD',
    function () {
        betDownValidation();
    }
);

let allInButton = new Button(
    410, 330, 80, 50, 'All In', '#2FBDFD',
    function () {
        allIn();
    }
);

let dealButton = new Button(
    360, 400, 180, 60, 'Deal', '#2FBDFD',
    function () {
        dealValidation();
    }
);

let backButton = new Button(
    20, 20, 120, 50, 'Back', '#2FBDFD',
    function () {
        returnHome();
    }
);

// Function to play button sound effects when buttons are clicked
function playButtonSound() {
    buttonClickSound.currentTime = 0;
    buttonClickSound.play();
}

// Function to handle the click on the canvas
// This checks the status of each screen and detects a click event when the game is on that screen
function handleCanvasClick(e) {
    let mouseX = e.offsetX;
    let mouseY = e.offsetY;

    // Important for playing background music at the first detection of a button click
    if (backgroundMusic.paused) {
        backgroundMusic.play();
    }

    if (currentScreen === 'home') {
        if (playButton.clickIsInside(mouseX, mouseY)) {
            playButtonSound();
            playButton.onClick();
        }

        else if (tutorialButton.clickIsInside(mouseX, mouseY)) {
            playButtonSound();
            tutorialButton.onClick();
        }
    }

    else if (currentScreen === 'tutorial') {
        if (endTutorialButton.clickIsInside(mouseX, mouseY)) {
            playButtonSound();
            endTutorialButton.onClick();
        }
    }

    else if (currentScreen === 'game') {
        if (hitButton.clickIsInside(mouseX, mouseY)) {
            playButtonSound();
            hitButton.onClick();
        }

        else if (standButton.clickIsInside(mouseX, mouseY)) {
            playButtonSound();
            standButton.onClick();
        }
    }

    else if (currentScreen === 'end game') {
        if (playAgainButton.clickIsInside(mouseX, mouseY)) {
            playButtonSound();
            playAgainButton.onClick();
        }
    }

    else if (currentScreen === 'end turn') {
        if (continuePlayingButton.clickIsInside(mouseX, mouseY)) {
            playButtonSound();
            continuePlayingButton.onClick();
        }
    }

    else if (currentScreen === 'bet') {
        if (betUpButton.clickIsInside(mouseX, mouseY)) {
            playButtonSound();
            betUpButton.onClick();
        }

        else if (betDownButton.clickIsInside(mouseX, mouseY)) {
            playButtonSound();
            betDownButton.onClick();
        }

        else if (allInButton.clickIsInside(mouseX, mouseY)) {
            playButtonSound();
            allInButton.onClick();
        }

        else if (dealButton.clickIsInside(mouseX, mouseY)) {
            playButtonSound();
            dealButton.onClick();
        }

        else if (backButton.clickIsInside(mouseX, mouseY)) {
            playButtonSound();
            backButton.onClick();
        }
    }
}

// Function to build a deck, basically pushing each card from the cardNames array into the deck array
function buildDeck() {
    deck = [];
    for (let i = 0; i < cardNames.length; i++) {
        deck.push(cardNames[i]);
    }
}

// Function to shuffle the deck
// This just stores a random number in an index and swaps that index into the deck 
function shuffleDeck() {
    for (let i = 0; i < deck.length; i++) {
        let j = Math.floor(Math.random() * deck.length);
        let tempDeck = deck[i];
        deck[i] = deck[j];
        deck[j] = tempDeck;
    }
}

// Function to draw a card from the shuffled deck
function drawFromShuffledDeck() {
    return deck.pop();
}

// Function to validate bet up button, only letting user add bets if it does not exceed the balance
function betUpValidation() {
    if (currentBet + 100 <= playerBalance) {
        currentBet += 100;
        bettingMessage = '';
        drawBettingScreenCanvas();
    }
}

// Function to validate bet down button, only letting user subtract from bets if it does not go below 0
function betDownValidation() {
    if (currentBet - 100 >= 0) {
        currentBet -= 100;
        bettingMessage = '';
        drawBettingScreenCanvas();
    }
}

// Function for going all in! woo!
function allIn() {
    currentBet = playerBalance;
    bettingMessage = '';
    drawBettingScreenCanvas();
}

// Function to validate deal button before starting game
function dealValidation() {
    if (currentBet <= 0) {
        bettingMessage = 'Bet cannot be less than $0!';
        drawBettingScreenCanvas();
        return;
    }
    else if (currentBet > playerBalance) {
        bettingMessage = 'Bet cannot exceed balance!';
        drawBettingScreenCanvas();
        return;
    }
    else {
        startGame();
    }
}

// Function to start the game
// Calls functions, draws starting cards, draws buttons, draws bet and balance values, and check if anyone gets a Blackjack (natural 21)
function startGame() {
    currentScreen = 'game';

    ctx.clearRect(0, 0, c.width, c.height);

    buildDeck();
    shuffleDeck();

    playerHand = [];
    for (let i = 0; i < 2; i++) {
        playerHand.push(drawFromShuffledDeck());
    }

    dealerHand = [];
    for (let i = 0; i < 2; i++) {
        dealerHand.push(drawFromShuffledDeck());
    }

    drawPlayerHandCanvas();
    drawDealerHandCanvas();

    hitButton.drawButton();
    standButton.drawButton();

    drawPlayerBetBalanceCanvas();

    // Check if the player or dealer get starting card total of 21, which = Blackjack natural 21 and auto win
    if (calculateHandValue(playerHand) === 21) {
        endTurn();
    }
    else if (calculateHandValue(dealerHand) === 21) {
        endTurn();
    }
}

// Function to start the tutorial, just displaying the basic mechanics
function startTutorial() {
    currentScreen = 'tutorial';

    ctx.clearRect(0, 0, c.width, c.height);
    ctx.save();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '40px Times New Roman';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('How to play Blackjack', c.width / 2, 100);

    ctx.font = '30px Times New Roman';
    ctx.fillText('Goal: Get as close to 21 as possible without going over.', c.width / 2, 160);
    ctx.fillText('Normal Cards = face value', c.width / 2, 200);
    ctx.fillText('Face Cards = 10', c.width / 2, 240);
    ctx.fillText('Aces = 1 or 11', c.width / 2, 280);
    ctx.fillText('You can "Hit" to draw a card, and "Stand" to end your turn.', c.width / 2, 320);
    ctx.fillText('Get 21 with starting 2 cards (Natural 21) = Blackjack! Auto win!', c.width / 2, 360);
    ctx.restore();

    endTutorialButton.drawButton();
}

// Function to return to home screen (need to redraw buttons and logo too)
function returnHome() {
    currentScreen = 'home';

    ctx.clearRect(0, 0, c.width, c.height);

    gameLogo.drawLogo();
    playButton.drawButton();
    tutorialButton.drawButton();
}

// Function to start betting screen before starting game 
function startBettingScreen() {
    currentScreen = 'bet';

    // Pause the coins sound (because the audio file is longer in length)
    coinSound.pause();

    drawBettingScreenCanvas();
}

// Function to reset player bet and balance
function resetPlayerCurrency() {
    currentBet = 0;
    playerBalance = 1000;
}

// Function to check and update the highest balance the player has achieved
function updateHighestBalance() {
    if (playerBalance > highestBalance) {
        highestBalance = playerBalance;
    }
}

// Function to draw the betting screen on the canvas (including buttons and text)
function drawBettingScreenCanvas() {
    ctx.clearRect(0, 0, c.width, c.height);

    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '50px Times New Roman';
    ctx.textAlign = 'center';
    ctx.fillText('Place Your Bet', c.width / 2, 120);

    ctx.font = '30px Times New Roman';
    ctx.fillText('Balance: $' + playerBalance, c.width / 2, 200);
    ctx.fillText('Current Bet: $' + currentBet, c.width / 2, 230);

    ctx.fillStyle = '#FDD700';
    ctx.font = '20px Times New Roman';
    ctx.fillText(bettingMessage, c.width / 2, 270);
    ctx.restore();

    betUpButton.drawButton();
    allInButton.drawButton();
    betDownButton.drawButton();
    dealButton.drawButton();
    backButton.drawButton();
}

// Function to draw the bet and balance amounts and display on the screen while user is playing
function drawPlayerBetBalanceCanvas() {
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Times New Roman';
    ctx.textAlign = 'left';
    ctx.fillText('Bet: $' + currentBet, 20, c.height - 40);
    ctx.fillText('Balance: $' + playerBalance, 20, c.height - 10);
    ctx.restore();
}

// Function to draw the player's cards and their cards' total value on the canvas
function drawPlayerHandCanvas() {
    let cardX = 320;
    let cardY = 320;

    for (let i = 0; i < playerHand.length; i++) {
        let cardName = playerHand[i];
        let img = cardImages[cardName];

        ctx.save();
        ctx.drawImage(img, cardX + (i * 30), cardY, 150, 200);
        ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '30px Times New Roman';
    ctx.fillText('Player Total: ' + calculateHandValue(playerHand), 620, 450);
    ctx.restore();
}

// Function to draw the dealer's cards and their cards' total value on the canvas
function drawDealerHandCanvas() {
    let cardX = 320;
    let cardY = 50;

    for (let i = 0; i < dealerHand.length; i++) {
        let cardName = dealerHand[i];
        let img = cardImages[cardName];

        ctx.save();
        ctx.drawImage(img, cardX + (i * 30), cardY, 150, 200);
        ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '30px Times New Roman';
    ctx.fillText('Dealer Total: ' + calculateHandValue(dealerHand), 620, 120);
    ctx.restore();
}

// Function to draw another card - when "Hit" button is clicked
// Also redraw buttons after clearRect
// Also check to make sure both hand totals don't exceed 21 and check if anyone gets Blackjack/natural 21
function drawCard() {
    ctx.clearRect(0, 0, c.width, c.height);

    let newCard = drawFromShuffledDeck();
    playerHand.push(newCard);
    drawPlayerHandCanvas();

    drawDealerHandCanvas();

    hitButton.drawButton();
    standButton.drawButton();

    drawPlayerBetBalanceCanvas();

    if (calculateHandValue(playerHand) > 21) {
        endTurn();
    }
    else if (calculateHandValue(dealerHand) > 21) {
        endTurn();
    }
    else if (calculateHandValue(playerHand) === 21) {
        endTurn();
    }
    else if (calculateHandValue(dealerHand) === 21) {
        endTurn();
    }
}

// Function to calculate the total value of cards in the player's or dealer's hand
// Assigns values to whatever the card's number is; if the card is King, Queen, Jack, or Ace it gets assigned a value too
function calculateHandValue(hand) {
    let total = 0;
    let aceCount = 0;

    for (let i = 0; i < hand.length; i++) {
        let card = hand[i];
        let rankValue = card.slice(0, -1);

        if (!isNaN(rankValue)) {
            total += Number(rankValue);
        }

        else if (rankValue === 'J' || rankValue === 'Q' || rankValue === 'K') {
            total += 10;
        }

        else if (rankValue === 'A') {
            total += 11;
            aceCount++;
        }
    }

    // Adjust Ace values from 11 to 1 if applicable (subtract by 10 to be left with Ace = 1)
    while (total > 21 && aceCount > 0) {
        total -= 10;
        aceCount--;
    }

    return total;
}

// Function to end the current turn - when "Stand" button is clicked
function endTurn() {
    ctx.clearRect(0, 0, c.width, c.height);

    // Dealer keeps hitting until Dealer total reaches 17 and up AND player's hand is still below 21
    while (calculateHandValue(dealerHand) < 17 && calculateHandValue(playerHand) < 21) {
        dealerHand.push(drawFromShuffledDeck());
    }

    drawDealerHandCanvas();

    drawPlayerHandCanvas();

    hitButton.drawButton();
    standButton.drawButton();

    drawPlayerBetBalanceCanvas();

    let playerTotal = calculateHandValue(playerHand);
    let dealerTotal = calculateHandValue(dealerHand);

    let result = '';

    // Check different conditions if the player wins, dealer wins, both tied, etc.
    if (playerTotal > 21) {
        result = 'You busted! Dealer wins! Big L man.';
        playerBalance -= currentBet;
        updateHighestBalance();

        // Reset audio before playing it
        loseSound.currentTime = 0;
        loseSound.play();
    }
    else if (dealerTotal > 21) {
        result = 'Dealer busted! You win! HUGE W!';
        playerBalance += currentBet;
        updateHighestBalance();

        winSound.currentTime = 0;
        winSound.play();
        coinSound.currentTime = 0;
        coinSound.play();
    }
    else if (playerTotal > dealerTotal) {
        result = 'You win! EZ WIN!';
        playerBalance += currentBet;
        updateHighestBalance();

        winSound.currentTime = 0;
        winSound.play();
        coinSound.currentTime = 0;
        coinSound.play();
    }
    else if (playerTotal < dealerTotal) {
        result = 'Dealer wins! Might be a skill issue.';
        playerBalance -= currentBet;
        updateHighestBalance();

        loseSound.currentTime = 0;
        loseSound.play();
    }
    else {
        result = 'It is a tie!';
        tiedSound.currentTime = 0;
        tiedSound.play();
    }

    // Reset the amount bet, user must input how much to bet again
    currentBet = 0;

    // Drawing results screens
    if (playerBalance <= 0) {
        currentScreen = 'end game';

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, c.width, c.height);

        ctx.shadowColor = '#0000FF';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '40px Times New Roman';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('You lost all your money!', c.width / 2, 230);
        ctx.fillText('Game over.', c.width / 2, 280);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '30px Times New Roman';
        ctx.textAlign = 'center';
        ctx.fillText('Highest Balance: $' + highestBalance, c.width / 2, 330);
        ctx.restore();

        playAgainButton.drawButton();
    }
    else {
        currentScreen = 'end turn';

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, c.width, c.height);

        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '40px Times New Roman';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(result, c.width / 2, 280);
        ctx.restore();

        continuePlayingButton.drawButton();
    }
}