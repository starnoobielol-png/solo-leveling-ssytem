// ========================================
// DAILY QUESTS
// ========================================

const dailyQuests = [

    {
        id: "pushups",
        name: "50 Push-ups",
        xp: 10,
        stat: "strength"
    },

    {
        id: "squats",
        name: "100 Squats",
        xp: 10,
        stat: "strength"
    },

    {
        id: "plank",
        name: "3 min Plank",
        xp: 10,
        stat: "strength"
    },

    {
        id: "steps",
        name: "10,000 Steps",
        xp: 10,
        stat: "endurance"
    },

    {
        id: "development",
        name: "30 min Personal Development",
        xp: 10,
        stat: "intelligence"
    },

    {
        id: "calories",
        name: "Hit Calorie Goal",
        xp: 10,
        stat: "discipline"
    }

];



// ========================================
// SIDE QUESTS
// ========================================

const sideQuests = [

    {
        id: "gym",
        name: "Gym",
        xp: 75,
        stat: "strength"
    },

    {
        id: "bjj",
        name: "BJJ",
        xp: 100,
        stat: "strength"
    },

    {
        id: "running",
        name: "Löprunda",
        xp: 60,
        stat: "endurance"
    }

];



// ========================================
// REWARD SHOP
// ========================================

const rewardShop = [

    {
        id: "foodora",
        name: "Foodora",
        cost: 1
    },

    {
        id: "fans100",
        name: "Fans 100",
        cost: 2
    },

    {
        id: "candy",
        name: "Godis",
        cost: 3
    },

    {
        id: "fans500",
        name: "Fans 500",
        cost: 6
    },

    {
        id: "boosterbox",
        name: "Booster Box",
        cost: 10
    },

    {
        id: "fans1000",
        name: "Fans 1000",
        cost: 10
    }

];



// ========================================
// LOAD PLAYER
// ========================================

let player =
    loadPlayer();



// ========================================
// DOM ELEMENTS
// ========================================

const questList =
    document.getElementById(
        "questList"
    );


const sideQuestList =
    document.getElementById(
        "sideQuestList"
    );


const levelText =
    document.getElementById(
        "levelText"
    );


const xpText =
    document.getElementById(
        "xpText"
    );


const totalXPText =
    document.getElementById(
        "totalXPText"
    );


const xpProgress =
    document.getElementById(
        "xpProgress"
    );


const streakText =
    document.getElementById(
        "streakText"
    );


const completionCard =
    document.getElementById(
        "completionCard"
    );


const tokenCount =
    document.getElementById(
        "tokenCount"
    );


const topTokenText =
    document.getElementById(
        "topTokenText"
    );


const shopList =
    document.getElementById(
        "shopList"
    );


const shopMessage =
    document.getElementById(
        "shopMessage"
    );


const resetButton =
    document.getElementById(
        "resetButton"
    );


const levelUpOverlay =
    document.getElementById(
        "levelUpOverlay"
    );


const levelChangeText =
    document.getElementById(
        "levelChangeText"
    );


const levelRewardText =
    document.getElementById(
        "levelRewardText"
    );


const popupTokenTotal =
    document.getElementById(
        "popupTokenTotal"
    );


const levelUpContinueButton =
    document.getElementById(
        "levelUpContinueButton"
    );


const xpAnimationArea =
    document.getElementById(
        "xpAnimationArea"
    );



// ========================================
// XP CURVE
// ========================================

// Level 1 -> 2 = 100 XP
//
// Därefter ökar XP-kravet
// med en potenskurva.
//
// Formel:
// 100 × level^1.3

function xpNeededForLevel(level) {

    return Math.round(

        100 *

        Math.pow(
            level,
            1.3
        )

    );

}



// ========================================
// LEVEL CALCULATION
// ========================================

function calculateLevelData() {

    let remainingXP =
        Math.max(
            0,
            player.totalXP
        );


    let level =
        1;


    let safetyCounter =
        0;


    while (
        safetyCounter < 1000
    ) {

        const requiredXP =
            xpNeededForLevel(
                level
            );


        if (
            remainingXP <
            requiredXP
        ) {

            return {

                level:
                    level,

                currentXP:
                    remainingXP,

                requiredXP:
                    requiredXP

            };

        }


        remainingXP -=
            requiredXP;


        level +=
            1;


        safetyCounter +=
            1;

    }


    return {

        level:
            level,

        currentXP:
            0,

        requiredXP:
            xpNeededForLevel(
                level
            )

    };

}



// ========================================
// LEVEL UP
// ========================================

function checkForLevelUps() {

    const levelData =
        calculateLevelData();


    const currentLevel =
        levelData.level;


    if (
        currentLevel <=
        player.highestLevelReached
    ) {

        return;

    }


    const oldLevel =
        player.highestLevelReached;


    const levelsGained =
        currentLevel -
        oldLevel;


    // 1 TOKEN PER LEVEL

    player.tokens +=
        levelsGained;


    player.highestLevelReached =
        currentLevel;


    savePlayer();


    showLevelUpPopup(

        oldLevel,

        currentLevel,

        levelsGained

    );

}



// ========================================
// LEVEL UP POPUP
// ========================================

function showLevelUpPopup(

    oldLevel,

    newLevel,

    tokensGained

) {

    levelChangeText.textContent =
        `LEVEL ${oldLevel} → LEVEL ${newLevel}`;


    levelRewardText.textContent =

        tokensGained === 1

            ? "+1 TOKEN"

            : `+${tokensGained} TOKENS`;


    popupTokenTotal.textContent =
        `Total Tokens: ${player.tokens}`;


    levelUpOverlay
        .classList
        .add(
            "show"
        );


    levelUpOverlay
        .setAttribute(
            "aria-hidden",
            "false"
        );

}



// ========================================
// CLOSE LEVEL UP POPUP
// ========================================

levelUpContinueButton
    .addEventListener(

        "click",

        () => {

            levelUpOverlay
                .classList
                .remove(
                    "show"
                );


            levelUpOverlay
                .setAttribute(
                    "aria-hidden",
                    "true"
                );


            updateUI();

            renderShop();

        }

    );



// ========================================
// XP ANIMATION
// ========================================

function showXpAnimation(
    amount
) {

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "xp-gain";


    if (
        amount < 0
    ) {

        element.classList.add(
            "xp-loss"
        );

    }


    element.textContent =

        amount >= 0

            ? `+${amount} XP`

            : `${amount} XP`;


    xpAnimationArea
        .appendChild(
            element
        );


    setTimeout(

        () => {

            element.remove();

        },

        900

    );

}



// ========================================
// DATE
// ========================================

function getToday() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        `${year}-${month}-${day}`
    );

}



// ========================================
// DATE DIFFERENCE
// ========================================

function differenceInDays(

    oldDate,

    newDate

) {

    const oldParts =
        oldDate.split("-");


    const newParts =
        newDate.split("-");


    const oldUTC =
        Date.UTC(

            Number(
                oldParts[0]
            ),

            Number(
                oldParts[1]
            ) - 1,

            Number(
                oldParts[2]
            )

        );


    const newUTC =
        Date.UTC(

            Number(
                newParts[0]
            ),

            Number(
                newParts[1]
            ) - 1,

            Number(
                newParts[2]
            )

        );


    return Math.round(

        (
            newUTC -
            oldUTC
        )

        /

        (
            1000 *
            60 *
            60 *
            24
        )

    );

}



// ========================================
// NEW DAY
// ========================================

function checkForNewDay() {

    const today =
        getToday();


    // FIRST START

    if (
        !player.currentDate
    ) {

        player.currentDate =
            today;


        savePlayer();

        return;

    }


    // SAME DAY

    if (
        player.currentDate ===
        today
    ) {

        return;

    }


    const previousDate =
        player.currentDate;


    const previousDayComplete =
        dailyQuests.every(

            quest =>

                player
                    .completedQuests[
                        quest.id
                    ] === true

        );


    const daysDifference =
        differenceInDays(

            previousDate,

            today

        );


    // BREAK STREAK IF A DAY
    // WAS MISSED

    if (

        !previousDayComplete ||

        daysDifference > 1

    ) {

        player.streak =
            0;

    }


    // RESET DAILY DATA

    player.completedQuests =
        {};


    player.completedSideQuests =
        {};


    player.perfectBonusGiven =
        false;


    player.currentDate =
        today;


    savePlayer();


    updateDate();


    render();

}



// ========================================
// DATE DISPLAY
// ========================================

function updateDate() {

    const formattedDate =
        new Date()
            .toLocaleDateString(

                "sv-SE",

                {

                    weekday:
                        "long",

                    day:
                        "numeric",

                    month:
                        "long"

                }

            );


    document
        .getElementById(
            "dateText"
        )
        .textContent =
            formattedDate;

}



// ========================================
// CREATE QUEST ELEMENT
// ========================================

function createQuestElement(

    quest,

    completionObject,

    changeFunction

) {

    const questElement =
        document.createElement(
            "div"
        );


    questElement.className =
        "quest";


    const checkbox =
        document.createElement(
            "input"
        );


    checkbox.type =
        "checkbox";


    checkbox.checked =
        completionObject[
            quest.id
        ] === true;


    checkbox.setAttribute(
        "aria-label",
        quest.name
    );


    if (
        checkbox.checked
    ) {

        questElement
            .classList
            .add(
                "completed"
            );

    }


    const info =
        document.createElement(
            "div"
        );


    info.className =
        "quest-info";


    const name =
        document.createElement(
            "div"
        );


    name.className =
        "quest-name";


    name.textContent =
        quest.name;


    const xp =
        document.createElement(
            "div"
        );


    xp.className =
        "quest-xp";


    xp.textContent =
        `+${quest.xp} XP`;


    info.appendChild(
        name
    );


    info.appendChild(
        xp
    );


    questElement.appendChild(
        checkbox
    );


    questElement.appendChild(
        info
    );


    checkbox
        .addEventListener(

            "change",

            () => {

                changeFunction(

                    quest,

                    checkbox.checked

                );

            }

        );


    return questElement;

}



// ========================================
// DAILY QUEST RENDER
// ========================================

function renderDailyQuests() {

    questList.innerHTML =
        "";


    dailyQuests.forEach(

        quest => {

            const element =
                createQuestElement(

                    quest,

                    player
                        .completedQuests,

                    handleDailyQuest

                );


            questList
                .appendChild(
                    element
                );

        }

    );

}



// ========================================
// SIDE QUEST RENDER
// ========================================

function renderSideQuests() {

    sideQuestList.innerHTML =
        "";


    sideQuests.forEach(

        quest => {

            const element =
                createQuestElement(

                    quest,

                    player
                        .completedSideQuests,

                    handleSideQuest

                );


            sideQuestList
                .appendChild(
                    element
                );

        }

    );

}



// ========================================
// UPDATE QUEST
// ========================================

function updateQuest(

    quest,

    completed,

    completionObject

) {

    const wasCompleted =
        completionObject[
            quest.id
        ] === true;


    if (
        completed ===
        wasCompleted
    ) {

        return;

    }


    completionObject[
        quest.id
    ] =
        completed;


    if (
        completed
    ) {

        player.totalXP +=
            quest.xp;


        player.stats[
            quest.stat
        ] +=
            1;


        player.stats
            .discipline +=
            1;


        showXpAnimation(
            quest.xp
        );

    }


    else {

        player.totalXP =
            Math.max(

                0,

                player.totalXP -
                quest.xp

            );


        player.stats[
            quest.stat
        ] =
            Math.max(

                0,

                player.stats[
                    quest.stat
                ] - 1

            );


        player.stats
            .discipline =
            Math.max(

                0,

                player.stats
                    .discipline - 1

            );


        showXpAnimation(
            -quest.xp
        );

    }

}



// ========================================
// DAILY QUEST HANDLER
// ========================================

function handleDailyQuest(

    quest,

    completed

) {

    updateQuest(

        quest,

        completed,

        player.completedQuests

    );


    checkPerfectDay();


    checkForLevelUps();


    savePlayer();


    render();

}



// ========================================
// SIDE QUEST HANDLER
// ========================================

function handleSideQuest(

    quest,

    completed

) {

    updateQuest(

        quest,

        completed,

        player
            .completedSideQuests

    );


    checkForLevelUps();


    savePlayer();


    render();

}



// ========================================
// PERFECT DAY
// ========================================

function checkPerfectDay() {

    const allComplete =
        dailyQuests.every(

            quest =>

                player
                    .completedQuests[
                        quest.id
                    ] === true

        );


    if (

        allComplete &&

        !player
            .perfectBonusGiven

    ) {

        player.totalXP +=
            20;


        player
            .perfectBonusGiven =
            true;


        player.streak +=
            1;


        player.stats
            .discipline +=
            3;


        showXpAnimation(
            20
        );


        checkForLevelUps();

    }


    completionCard
        .classList
        .toggle(

            "show",

            allComplete

        );

}



// ========================================
// REWARD SHOP
// ========================================

function renderShop() {

    shopList.innerHTML =
        "";


    rewardShop.forEach(

        reward => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "shop-item";


            const info =
                document.createElement(
                    "div"
                );


            info.className =
                "shop-info";


            const name =
                document.createElement(
                    "span"
                );


            name.className =
                "shop-name";


            name.textContent =
                reward.name;


            const cost =
                document.createElement(
                    "span"
                );


            cost.className =
                "shop-cost";


            cost.textContent =

                reward.cost === 1

                    ? "1 Token"

                    : `${reward.cost} Tokens`;


            info.appendChild(
                name
            );


            info.appendChild(
                cost
            );


            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "redeem-button";


            button.textContent =
                "Redeem";


            button.disabled =
                player.tokens <
                reward.cost;


            button
                .addEventListener(

                    "click",

                    () => {

                        redeemReward(
                            reward
                        );

                    }

                );


            item.appendChild(
                info
            );


            item.appendChild(
                button
            );


            shopList
                .appendChild(
                    item
                );

        }

    );

}



// ========================================
// REDEEM REWARD
// ========================================

function redeemReward(
    reward
) {

    if (
        player.tokens <
        reward.cost
    ) {

        shopMessage.textContent =
            "Not enough tokens.";

        return;

    }


    const confirmed =
        confirm(

            `Använd ${reward.cost} token(s) för ${reward.name}?`

        );


    if (
        !confirmed
    ) {

        return;

    }


    player.tokens -=
        reward.cost;


    savePlayer();


    shopMessage.textContent =
        `${reward.name} redeemed!`;


    updateUI();


    renderShop();

}



// ========================================
// UPDATE UI
// ========================================

function updateUI() {

    const levelData =
        calculateLevelData();


    const percentage =
        Math.min(

            100,

            (
                levelData.currentXP /
                levelData.requiredXP
            ) * 100

        );


    levelText.textContent =
        levelData.level;


    xpText.textContent =
        `${levelData.currentXP} / ${levelData.requiredXP}`;


    totalXPText.textContent =
        `Total XP: ${player.totalXP}`;


    xpProgress.style.width =
        `${percentage}%`;


    streakText.textContent =
        player.streak;


    tokenCount.textContent =
        player.tokens;


    topTokenText.textContent =
        player.tokens;


    document
        .getElementById(
            "strengthStat"
        )
        .textContent =
            player.stats
                .strength;


    document
        .getElementById(
            "enduranceStat"
        )
        .textContent =
            player.stats
                .endurance;


    document
        .getElementById(
            "disciplineStat"
        )
        .textContent =
            player.stats
                .discipline;


    document
        .getElementById(
            "intelligenceStat"
        )
        .textContent =
            player.stats
                .intelligence;

}



// ========================================
// RENDER
// ========================================

function render() {

    renderDailyQuests();


    renderSideQuests();


    renderShop();


    updateUI();


    const allComplete =
        dailyQuests.every(

            quest =>

                player
                    .completedQuests[
                        quest.id
                    ] === true

        );


    completionCard
        .classList
        .toggle(

            "show",

            allComplete

        );

}



// ========================================
// SAVE
// ========================================

function savePlayer() {

    localStorage.setItem(

        "soloLevelingPlayer",

        JSON.stringify(
            player
        )

    );

}



// ========================================
// LOAD
// ========================================

function loadPlayer() {

    const defaultPlayer = {

        totalXP:
            0,

        tokens:
            0,

        streak:
            0,

        currentDate:
            "",

        perfectBonusGiven:
            false,

        completedQuests:
            {},

        completedSideQuests:
            {},

        highestLevelReached:
            1,

        stats: {

            strength:
                0,

            endurance:
                0,

            discipline:
                0,

            intelligence:
                0

        }

    };


    const saved =
        localStorage
            .getItem(
                "soloLevelingPlayer"
            );


    if (
        !saved
    ) {

        return defaultPlayer;

    }


    try {

        const parsed =
            JSON.parse(
                saved
            );


        return {

            ...defaultPlayer,

            ...parsed,


            completedQuests: {

                ...defaultPlayer
                    .completedQuests,

                ...(
                    parsed
                        .completedQuests ||
                    {}
                )

            },


            completedSideQuests: {

                ...defaultPlayer
                    .completedSideQuests,

                ...(
                    parsed
                        .completedSideQuests ||
                    {}
                )

            },


            stats: {

                ...defaultPlayer
                    .stats,

                ...(
                    parsed.stats ||
                    {}
                )

            }

        };

    }


    catch (
        error
    ) {

        console.error(

            "Could not load save:",

            error

        );


        return defaultPlayer;

    }

}



// ========================================
// RESET TEST DATA
// ========================================

resetButton
    .addEventListener(

        "click",

        () => {

            const confirmed =
                confirm(

                    "Är du säker? All XP, levels, tokens, quests, stats och streak kommer att raderas."

                );


            if (
                !confirmed
            ) {

                return;

            }


            localStorage
                .removeItem(
                    "soloLevelingPlayer"
                );


            location.reload();

        }

    );



// ========================================
// START
// ========================================

checkForNewDay();


updateDate();


checkForLevelUps();


savePlayer();


render();



// ========================================
// MIDNIGHT CHECK
// ========================================

// Kollar var 30:e sekund
// om datumet har ändrats.

setInterval(

    checkForNewDay,

    30000

);

// ========================================
// SERVICE WORKER
// ========================================

if (
    "serviceWorker" in navigator
) {

    window.addEventListener(
        "load",
        () => {

            navigator
                .serviceWorker
                .register(
                    "./service-worker.js"
                )
                .then(
                    registration => {

                        console.log(
                            "Service Worker registered:",
                            registration.scope
                        );

                    }
                )
                .catch(
                    error => {

                        console.error(
                            "Service Worker failed:",
                            error
                        );

                    }
                );

        }
    );

}