// Initialize Firebase

// You can't write or delete anyways :)
if (!firebase.apps.length) {
    firebase.initializeApp({
        apiKey: "AIzaSyBmjQ04nOgHnZCeDFewnRGf8VFkA5RRP0U",
        authDomain: "clubfinder-135ce.firebaseapp.com",
        projectId: "clubfinder-135ce",
        storageBucket: "clubfinder-135ce.firebasestorage.app",
        messagingSenderId: "60854435320",
        appId: "1:60854435320:web:1ae20d0bfcfbb78806ea0d"
    });    
} else {
    firebase.app();
}

// Initialize Firestore
const db = firebase.firestore();

// LOAD FROM FIREBASE functions
async function loadClubs() {
    const result = await fetchCollection('clubs');
    console.log("Loaded Clubs:", result);
    
    clubs = result;
}

// starting page
const startQuiz = () => {
    const startQuizButton = document.querySelector('.landing-button');

    startQuizButton.addEventListener('click', () => {
        // test
        startQuizButton.classList.add('scale-up');

        setTimeout(() => {
            displayQuestion(currentQuestionIndex);
            startQuizButton.remove();
            // remove landing styles
            document.querySelector('.div-credit').remove();
            document.querySelector('.body-landing').classList.replace('body-landing', 'body-quiz');
            document.querySelector('.description-landing').classList.replace('description-landing', 'body-quiz');
            document.querySelector('.landing-container').classList.replace('landing-container', 'container-quiz');
            document.querySelector('.h1-landing').classList.replace('h1-landing', 'h1-quiz');
            document.querySelector('#question-container').classList.add('question-container-quiz');
            document.querySelector('#answers-container').classList.add('answers-container-quiz');
            mainAnimation();

            // clickable CF logo
            document.querySelector('.h1-quiz').addEventListener('click', () => {
            location.reload();
        }); 
        }, 200);              
    })
};

var totalQuestions = 0;

// load questions and display first question
const loadQuestions = async () => {
    const questionsSnapshot = await db.collection('questions').get();
    questions = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    totalQuestions = questions.length;
    console.log("Loaded Questions:", questions);
    startQuiz(); 
};

// auxiliary function
async function fetchCollection(collection_name) {
    const clubsSnapshot = await db.collection(collection_name).get();
    const clubsList = clubsSnapshot.docs.map(doc => doc.data());
    return clubsList;
}

// call load functions
loadClubs()
    .then(() => {
        // (DELETE LATER) count unique tags
        let tags_arr = [];
        clubs.forEach(club => {
            club.tags.forEach(tag => {
                if (!tags_arr.includes(tag)) {
                    tags_arr.push(tag);
                };
            });
        });
        tags_arr.sort();
        console.log("Array of tags:", tags_arr);
    });

loadQuestions();

// global variables
let questions = [];
let currentQuestionIndex = 0;
let selectedAnswers = [];
let clubs = [];

// show last page with results
const showResults = async (questionTextElement, answersContainer) => {

    questionTextElement.textContent = "Based on your choices, we found some clubs you might love!";
    answersContainer.textContent = '';

    const tagCounts = getTagScores();
    const bestThreeClubs = findTopClubs(tagCounts, clubs);

    const clubsListElement = document.createElement('ol');
    clubsListElement.classList.add('clubsListElement');

    for (let i = 0; i < bestThreeClubs.length; i++) {
        const addClubElement = document.createElement('li');
        addClubElement.innerHTML = bestThreeClubs[i].name;
        clubsListElement.appendChild(addClubElement);
    }
    const parentElement = document.querySelector('#question-container');
    document.body.appendChild(clubsListElement, parentElement);

    const startOverButton = document.createElement('button');
    startOverButton.innerText = 'Start Over';
    startOverButton.classList.add('btn-result');
    document.body.appendChild(startOverButton, parentElement);
    startOverButton.onclick = startOverButtonClick(startOverButton);

    const listButton = document.createElement('a');
    listButton.innerText = 'Explore All Clubs at BC';
    listButton.classList.add('list-btn-result');
    listButton.setAttribute('href', 'https://www.bellevuecollege.edu/organizations/active/#tab_tab_0e51dc81-51eb-45c8-a419-a7fb183809e4');
    document.body.insertBefore(listButton, startOverButton);

    // remove skip button
    if(document.querySelector('.skip-button')) {
        document.querySelector('.skip-button').remove();
    }

    // confetti animation
    confetti({
        particleCount: 400,
        spread: 50,
        origin: { y: 0.6 },
      });

}

// display single question by its index
const displayQuestion = (index) => {

    // styling
    if (!document.querySelector('h2')) {
        const questionNumberElement = document.createElement('h2');
        questionNumberElement.innerHTML = `Question ${index + 1}<span class="total-ques-quiz">/${totalQuestions}</span>`;
        questionNumberElement.classList.add('ques-num-quiz');
        document.body.insertBefore(questionNumberElement, document.querySelector('#quiz-container'));        
        const dottedLine = document.createElement('hr');
        dottedLine.classList.add('hr-quiz');
        document.body.insertBefore(dottedLine, document.querySelector('#quiz-container'));
    } else {
        document.querySelector('h2').innerHTML = `Question ${index + 1}<span class="total-ques-quiz">/${totalQuestions}</span>`;
    }

    const question = questions[index];
    const questionTextElement = document.getElementById('question-text');
    const answersContainer = document.getElementById('answers-container');

    if (index >= questions.length) {
        showResults(questionTextElement, answersContainer);
        document.querySelector('h2').remove();
        document.querySelector('hr').remove();
        document.querySelector('#answers-container').classList.replace('answers-container-quiz', 'answers-container-result');
        document.querySelector('#question-container').classList.replace('question-container-quiz', 'question-container-result');
        document.querySelector('.body-quiz').classList.replace('body-quiz', 'body-result');
        document.querySelector('.container-quiz').classList.replace('container-quiz', 'container-result');
        document.querySelector("#question-container").classList.remove('fade-out');
        return;
    }

    questionTextElement.textContent = question.text;
    answersContainer.innerHTML = '';

    if (!question.answers || Object.keys(question.answers).length === 0) {
        answersContainer.textContent = "No options available for this question.";
        return;
    }

    const questionContainer = document.querySelector("#question-container");

    Object.entries(question.answers).forEach(([key, value]) => {
        if (!value.tags.length) {
            return;
        }

        // buttons animations

        // fade-in-out animation
        const answersContainer = document.querySelector("#answers-container");
        const skipBtn = document.querySelector(".skip-button");

        if (questionContainer.classList.contains("fade-out")) {
            questionContainer.classList.replace("fade-out", "fade-in");
        } else {
            questionContainer.classList.add("fade-in");
        }

        answersContainer.onclick = () => {
            setTimeout(() => {
                questionContainer.classList.replace("fade-in", "fade-out");
            }, 200);
        }

        const answerButton = document.createElement('button');
        answerButton.textContent = value.answerText;
        answerButton.classList.add('answer-button');

        answerButton.onclick = () => {

            selectAnswer(value, key);
            currentQuestionIndex++;
        
            // scale-up animation
            answerButton.classList.add('scale-up');

            setTimeout(() => {
                displayQuestion(currentQuestionIndex); 
            }, 400);
        }

        answersContainer.appendChild(answerButton);
    })
    
    // skip button
    if (!document.querySelector('.skip-button')) {
        let skipButton = document.createElement('button');
        skipButton.textContent = "Skip Question";
        skipButton.classList.add('skip-button');
        answersContainer.insertAdjacentElement('afterend', skipButton);

        skipButton.classList.add('scale-down');

        document.querySelector('.skip-button').addEventListener('click', () => {

            skipButton.classList.replace('scale-down', 'scale-up');

            setTimeout(() => {
                questionContainer.classList.replace("fade-in", "fade-out");
            }, 200);

            setTimeout(() => {
                if (currentQuestionIndex < totalQuestions) {
                    currentQuestionIndex++;
                    displayQuestion(currentQuestionIndex);
                } else {          
                    showResults(questionTextElement, answersContainer);
                }
                skipButton.classList.replace('scale-up', 'scale-down');
            }, 400);
        });
    };
};

// button to start quiz over
const startOverButtonClick = (startOverButton) => {
    if (!startOverButton) {
        return;
    }
    startOverButton.addEventListener('click', () => {
        currentQuestionIndex = 0;
        selectedAnswers = [];

        // scale-up animation
        startOverButton.classList.add('scale-up');

        setTimeout(() => {
            displayQuestion(currentQuestionIndex);
            startOverButton.remove();
            document.querySelector('.clubsListElement').remove();
            document.querySelector('.list-btn-result').remove();
            document.querySelector('.question-container-result').classList.replace('question-container-result', 'question-container-quiz');
            document.querySelector('#answers-container').classList.add('answers-container-quiz');
            document.querySelector('.body-result').classList.replace('body-result', 'body-quiz');
            document.querySelector('.container-result').classList.replace('container-result', 'container-quiz');
            mainAnimationStartOver();
        }, 400);

        // displayQuestion(currentQuestionIndex);
        // startOverButton.remove();
        // document.querySelector('.clubsListElement').remove();
        // document.querySelector('.list-btn-result').remove();
        // document.querySelector('.question-container-result').classList.replace('question-container-result', 'question-container-quiz');
        // document.querySelector('#answers-container').classList.add('answers-container-quiz');
        // document.querySelector('.body-result').classList.replace('body-result', 'body-quiz');
        // document.querySelector('.container-result').classList.replace('container-result', 'container-quiz');
        // mainAnimationStartOver();
    });
};

// add selected answer to array
const selectAnswer = (answer, key) => {
    // console.log('Selected Answer:', answer);
    // console.log('Answer Key:', key);
    selectedAnswers[currentQuestionIndex] = answer.tags;
}

const mainAnimation = () => {
    // poor design...
    var el1 = document.querySelector('.ques-num-quiz');
    var el2 = document.querySelector('.hr-quiz');
    var el3 = document.querySelector('.container-quiz');
    var el4 = document.querySelector('.h1-quiz');
    el1.classList.add('inst-out');
    el2.classList.add('inst-out');
    el3.classList.add('inst-out');
    el4.classList.add('inst-out');
    setTimeout(() => {
        el1.classList.replace('inst-out', 'inst-in');
        el2.classList.replace('inst-out', 'inst-in');
        el3.classList.replace('inst-out', 'inst-in');
        el4.classList.replace('inst-out', 'h1-appear');
    }, 200);
    // test: el5
}

const mainAnimationStartOver = () => {
    // poor design 2 ...
    var el1 = document.querySelector('.ques-num-quiz');
    var el2 = document.querySelector('.hr-quiz');
    var el3 = document.querySelector('.container-quiz');
    el1.classList.add('inst-out');
    el2.classList.add('inst-out');
    el3.classList.replace('inst-in', 'inst-out');
    setTimeout(() => {
        el1.classList.add('inst-out', 'inst-in');
        el2.classList.add('inst-out', 'inst-in');
        el3.classList.replace('inst-out', 'inst-in');
    }, 200);
}
 
// calculate tag scores
const getTagScores = () => {
    const allTags = selectedAnswers.flat();
    const tagCounts = {};

    allTags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });

    return tagCounts;
}

// find three best matching clubs
const findTopClubs = (tagCounts, clubs) => {
    const clubScores = clubs.map(club => {
        let score = 0;
    
        club.tags.forEach(tag => {
          if (tagCounts[tag]) {
            score += tagCounts[tag];
          }
        });
    
        return { ...club, score };
      });
    
      clubScores.sort((a, b) => b.score - a.score);
      return clubScores.slice(0, 5);
};
