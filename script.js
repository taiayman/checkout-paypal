// --- Firebase Config (from user) --- 
const firebaseConfig = {
  apiKey: "AIzaSyC8atGBEd83BlG2a4_V5utVYuS1PczpQKw",
  authDomain: "ebook-zakaria.firebaseapp.com",
  projectId: "ebook-zakaria",
  storageBucket: "ebook-zakaria.firebasestorage.app",
  messagingSenderId: "311947320356",
  appId: "1:311947320356:web:f42b524ecb29873dee8cb1",
  measurementId: "G-WHDR2RTSLR"
};

// --- Initialize Firebase --- 
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- State --- 
let currentUserId = null; // To store the user's ID after registration
let selectedPlanId = null; // To store the chosen PayPal Plan ID

// --- Get DOM Elements --- 
const registrationStep = document.getElementById('registration-step');
const genderStep = document.getElementById('gender-step');
const ageStep = document.getElementById('age-step');
const genreStep = document.getElementById('genre-step');
const paypalStep = document.getElementById('paypal-step'); // Added
const finalSuccessStep = document.getElementById('final-success-step'); // Renamed

const registrationForm = document.getElementById('registration-form');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const createAccountButton = document.getElementById('create-account-button');

const genderOptionsContainer = document.getElementById('gender-options');
const genderNextButton = document.getElementById('gender-next-button');

const ageOptionsContainer = document.getElementById('age-options');
const ageNextButton = document.getElementById('age-next-button');

const genreOptionsContainer = document.getElementById('genre-options');
const genreFinishButton = document.getElementById('genre-finish-button');

// Added PayPal elements
const planOptionsContainer = document.getElementById('plan-options'); 
const paypalButtonContainer = document.getElementById('paypal-button-container');

const statusMessageDiv = document.getElementById('status-message');

// --- Helper Functions --- 
function showStep(stepElement) {
    // Hide all steps first
    [registrationStep, genderStep, ageStep, genreStep, paypalStep, finalSuccessStep].forEach(step => {
        if(step) step.classList.add('hidden');
    });
    // Show the target step
    if (stepElement) {
        stepElement.classList.remove('hidden');
    }
}

function setStatus(message, type = 'info') { // types: info, success, error
    statusMessageDiv.textContent = message;
    statusMessageDiv.classList.remove('text-red-600', 'text-green-600', 'text-gray-600');
    if (type === 'success') {
        statusMessageDiv.classList.add('text-green-600');
    } else if (type === 'error') {
        statusMessageDiv.classList.add('text-red-600');
    } else {
        statusMessageDiv.classList.add('text-gray-600'); // Default/info
    }
}

// --- Populate Email from URL --- 
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    if (email) {
        emailInput.value = email;
    } else {
        console.error('Email parameter missing from URL');
        setStatus('Error: Email is missing. Please return to the app and try again.', 'error');
        if (createAccountButton) createAccountButton.disabled = true;
    }
    showStep(registrationStep); // Show registration first
});

// --- Step 1: Handle Registration Form Submission --- 
registrationForm.addEventListener('submit', async (event) => {
    event.preventDefault(); 
    const name = nameInput.value.trim(); 
    const email = emailInput.value;
    const password = passwordInput.value;
    
    if (!name) return setStatus('Please enter your name.', 'error');
    if (!password) return setStatus('Please enter a password.', 'error');
    if (password.length < 6) return setStatus('Password should be at least 6 characters.', 'error');

    createAccountButton.disabled = true;
    setStatus('Creating account...', 'info');

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        currentUserId = user.uid; 
        console.log('Firebase Auth user created:', currentUserId);
        await user.updateProfile({ displayName: name });
        console.log('Firebase Auth profile updated.');
        await db.collection('users').doc(currentUserId).set({
            name: name,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isDisabled: false,
            gender: null,
            ageRange: null,
            favoriteGenres: [], 
            paypalSubscriptionId: null, // Initialize PayPal fields
            subscriptionStatus: 'Inactive',
        });
        console.log('Firestore user document created.');
        setStatus('');
        showStep(genderStep); 
    } catch (error) {
        console.error('Error creating account:', error);
        setStatus(`Error: ${error.message || 'Could not create account.'}`, 'error');
        createAccountButton.disabled = false; 
    }
}); 

// --- Step 2: Handle Gender Selection --- 
genderOptionsContainer.addEventListener('click', (event) => {
    const button = event.target.closest('.choice-button');
    if (!button) return;
    genderOptionsContainer.querySelectorAll('.choice-button.selected').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    setStatus('');
});

genderNextButton.addEventListener('click', async () => {
    const selectedButton = genderOptionsContainer.querySelector('.choice-button.selected');
    if (!selectedButton) return setStatus('Please select a gender.', 'error');
    if (!currentUserId) return setStatus('Error: User ID not found.', 'error');
    
    const genderValue = selectedButton.dataset.value;
    genderNextButton.disabled = true;
    setStatus('Saving gender...', 'info');
    try {
        await db.collection('users').doc(currentUserId).update({ gender: genderValue });
        console.log('Gender updated.');
        setStatus('');
        showStep(ageStep);
    } catch (error) {
        console.error('Error saving gender:', error);
        setStatus(`Error: ${error.message || 'Could not save gender.'}`, 'error');
    } finally {
        genderNextButton.disabled = false;
    }
});

// --- Step 3: Handle Age Selection --- 
ageOptionsContainer.addEventListener('click', (event) => {
    const button = event.target.closest('.choice-button');
    if (!button) return;
    ageOptionsContainer.querySelectorAll('.choice-button.selected').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    setStatus(''); 
});

ageNextButton.addEventListener('click', async () => {
    const selectedButton = ageOptionsContainer.querySelector('.choice-button.selected');
    if (!selectedButton) return setStatus('Please select an age range.', 'error');
    if (!currentUserId) return setStatus('Error: User ID not found.', 'error');

    const ageValue = selectedButton.dataset.value;
    ageNextButton.disabled = true;
    setStatus('Saving age range...', 'info');
    try {
        await db.collection('users').doc(currentUserId).update({ ageRange: ageValue });
        console.log('Age range updated.');
        setStatus('');
        showStep(genreStep); 
    } catch (error) {
        console.error('Error saving age range:', error);
        setStatus(`Error: ${error.message || 'Could not save age range.'}`, 'error');
    } finally {
        ageNextButton.disabled = false;
    }
});

// --- Step 4: Handle Genre Selection --- 
genreOptionsContainer.addEventListener('click', (event) => {
    const button = event.target.closest('.choice-button-multiple');
    if (!button) return;
    button.classList.toggle('selected');
    setStatus('');
});

genreFinishButton.addEventListener('click', async () => {
    const selectedButtons = genreOptionsContainer.querySelectorAll('.choice-button-multiple.selected');
    if (!currentUserId) return setStatus('Error: User ID not found.', 'error');

    const genreValues = Array.from(selectedButtons).map(button => button.dataset.value);
    genreFinishButton.disabled = true;
    setStatus('Saving preferences...', 'info');

    try {
        await db.collection('users').doc(currentUserId).update({ favoriteGenres: genreValues });
        console.log('Genres updated.');
        setStatus('Loading subscription plans...', 'info'); // Indicate loading
        
        console.log(">>> Calling loadAndDisplayPlans...");
        await loadAndDisplayPlans(); // Load plans BEFORE showing the step
        
        setStatus(''); // Clear 'Loading subscription plans...'
        showStep(paypalStep); // Transition to the PayPal step
    } catch (error) {
        console.error('Error saving genres or loading plans:', error);
        setStatus(`Error: ${error.message || 'Could not save preferences or load plans.'}`, 'error');
    } finally {
         genreFinishButton.disabled = false; // Re-enable button regardless
         console.log(">>> Genre finish button finally block executed.");
    }
});

// --- Step 5: Load Plans & Handle PayPal --- 

async function loadAndDisplayPlans() {
    console.log(">>> Entered loadAndDisplayPlans function.");
    planOptionsContainer.innerHTML = ''; // Clear any previous plans
    setStatus('Loading available plans...', 'info');
    paypalButtonContainer.innerHTML = ''; // Clear PayPal button container
    selectedPlanId = null; // Reset selected plan

    try {
        const plansQuery = firebase.firestore().collection('subscriptionPlans')
                                 .where('active', '==', true)
                                 .orderBy('price'); // Example ordering
        const snapshot = await plansQuery.get();
        console.log(">>> Firestore query snapshot received:", snapshot.size, "docs");

        if (snapshot.empty) {
            console.warn('No active subscription plans found in Firestore.');
            planOptionsContainer.innerHTML = '<p class="text-center text-gray-600">No subscription plans currently available.</p>';
            setStatus('No plans available.', 'info');
            return;
        }

        snapshot.forEach(doc => {
            const plan = doc.data();
            const planId = plan.paypalPlanId; // Get the actual PayPal Plan ID
            const firestoreDocId = doc.id; // Keep Firestore ID if needed for logging/debugging

            if (!planId) {
                console.warn(`Plan '${plan.name}' (ID: ${firestoreDocId}) is missing PayPal Plan ID and will be skipped.`);
                return; // Skip plans without a PayPal ID
            }

            // Create the button HTML dynamically
            const button = document.createElement('button');
            button.dataset.planId = planId; // Use the PayPal Plan ID from Firestore!
            button.classList.add(
                'choice-button', 
                'w-full', 
                'border-2', 
                'border-gray-200', 
                'rounded-xl', 
                'p-4', 
                'text-left', 
                'transition', 
                'duration-200', 
                'ease-in-out',
                'hover:border-primary'
            );

            // Format duration/type nicely (optional enhancement)
            let durationText = '';
            if (plan.duration && plan.durationType) {
                durationText = ` / ${plan.duration > 1 ? plan.duration + ' ' : ''}${plan.durationType}${plan.duration > 1 ? 's' : ''}`;
                 if (plan.durationType === 'month' && plan.duration === 1) durationText = ' / month';
                 if (plan.durationType === 'year' && plan.duration === 1) durationText = ' / year';
            }

            button.innerHTML = `
                <span class="font-semibold text-gray-800">${plan.name || 'Unnamed Plan'}</span>
                <span class="block text-sm text-gray-600">$${plan.price?.toFixed(2) || '0.00'}${durationText}</span>
                 ${plan.features && Array.isArray(plan.features) && plan.features.length > 0 ? 
                    `<ul class="list-disc list-inside text-xs text-gray-500 mt-1 pl-1">${plan.features.map(f => `<li>${f}</li>`).join('')}</ul>` : ''}
            `;

            planOptionsContainer.appendChild(button);
        });
        setStatus(''); // Clear loading message
        console.log(`Displayed ${snapshot.docs.length} active plans.`);

    } catch (error) {
        console.error('Error loading subscription plans:', error);
        console.log(">>> Error inside loadAndDisplayPlans:", error);
        planOptionsContainer.innerHTML = '<p class="text-center text-red-600">Error loading plans. Please try again later.</p>';
        setStatus('Error loading plans.', 'error');
    }
}

// Listener for plan selection (remains largely the same, but now acts on dynamic buttons)
planOptionsContainer.addEventListener('click', (event) => {
    const button = event.target.closest('.choice-button');
    if (!button) return;

    // Highlight selection
    planOptionsContainer.querySelectorAll('.choice-button.selected').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    
    selectedPlanId = button.dataset.planId; // Store selected plan ID
    console.log('Selected Plan ID:', selectedPlanId);
    setStatus(''); // Clear status

    // Render PayPal button now that a plan is selected
    renderPayPalButton(selectedPlanId); 
});

// Function to Render PayPal Button
function renderPayPalButton(planId) {
    if (!planId) {
        console.error('Cannot render PayPal button without a Plan ID.');
        return;
    }

    // Clear previous button if any
    paypalButtonContainer.innerHTML = ''; 
    setStatus('Loading payment options...', 'info');

    paypal.Buttons({
        createSubscription: function(data, actions) {
            // ** SECURITY WARNING **
            // In a production environment, this function should ideally call your server.
            // Your server would then use the PayPal REST API (with secret credentials)
            // to create the subscription and return the subscription ID to the client.
            // Passing the Plan ID directly from the client like this is suitable only for
            // testing/demo purposes with the Sandbox.
            console.log('Creating subscription for Plan ID:', planId);
            return actions.subscription.create({
                'plan_id': planId 
            });
        },

        onApprove: async function(data, actions) {
            // ** SECURITY WARNING **
            // This function is called when the user approves the payment in the PayPal popup.
            // *Crucially*, the `data.subscriptionID` received here HAS NOT been verified 
            // by your server yet. In a real application, you MUST send this ID 
            // to your backend, verify its status and details with the PayPal API, 
            // and only THEN update your database.
            // Directly updating Firestore here based on client-side confirmation is INSECURE.
            console.log('PayPal payment approved. Subscription Data:', data);
            setStatus('Processing payment...', 'info');
            // Disable further interactions during processing
            paypalButtonContainer.innerHTML = ''; // Remove buttons
            planOptionsContainer.style.pointerEvents = 'none'; // Disable plan selection
            
            try {
                await saveSubscriptionDetails(data.subscriptionID);
            } catch(error) {
                console.error('Error in onApprove after saving:', error);
                // Restore UI or show critical error message
                 setStatus('Critical error processing payment. Please contact support.', 'error');
            }
        },

        onError: function(err) {
            console.error('PayPal button error:', err);
            setStatus('An error occurred with PayPal. Please try selecting the plan again.', 'error');
            // Optionally re-enable plan selection or show a retry mechanism
            paypalButtonContainer.innerHTML = 'Error loading PayPal.'; // Simple error message
        },

        onCancel: function(data) {
            console.log('PayPal payment cancelled. Data:', data);
            setStatus('Payment cancelled. Select a plan to proceed.', 'info');
            // Keep the user on the PayPal step, allow re-selection
            paypalButtonContainer.innerHTML = ''; // Clear buttons
        }

    }).render('#paypal-button-container').then(() => {
        setStatus(''); // Clear 'Loading payment options...' message
    }).catch((err) => {
         console.error('Failed to render PayPal Buttons:', err);
         setStatus('Could not load PayPal payment options. Please refresh.', 'error');
    });
}

// --- Step 6: Save Subscription & Final Redirect --- 
async function saveSubscriptionDetails(subscriptionID) {
    if (!currentUserId) {
        console.error('Cannot save subscription, user ID is missing.');
        setStatus('Error: User session lost. Please refresh.', 'error');
        throw new Error('User ID missing'); // Throw error to be caught by onApprove
    }
     if (!subscriptionID) {
        console.error('Cannot save subscription, subscriptionID is missing.');
        setStatus('Error: Payment data incomplete. Please try again.', 'error');
        throw new Error('Subscription ID missing'); // Throw error to be caught by onApprove
    }

    setStatus('Finalizing account setup...', 'info');
    try {
         // ** INSECURE DATA UPDATE - SEE WARNING IN onApprove **
        await db.collection('users').doc(currentUserId).update({
            paypalSubscriptionId: subscriptionID,
            subscriptionStatus: 'Active', // Assume active, needs server verification!
            subscriptionUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('Subscription details saved to Firestore (Client-side).');

        // Show final success message
        setStatus('');
        showStep(finalSuccessStep);

        // Redirect back to the app after a delay
        setTimeout(() => {
            // Use a distinct deep link for successful payment
            window.location.href = 'myebookapp://payment/success'; 
        }, 2500); // Slightly longer delay

    } catch (error) {
        console.error('Error saving subscription details to Firestore:', error);
        setStatus(`Error saving payment details: ${error.message}. Please contact support.`, 'error');
        // Keep user on PayPal step or show specific error page? Decision needed.
        showStep(paypalStep); // Revert to PayPal step? Or show a generic error div?
         planOptionsContainer.style.pointerEvents = 'auto'; // Re-enable plan selection
         if (selectedPlanId) renderPayPalButton(selectedPlanId); // Try re-rendering button
        throw error; // Re-throw error to be caught by onApprove if needed
    }
} 
