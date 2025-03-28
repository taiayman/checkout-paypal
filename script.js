const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const paypalPlanIdInput = document.getElementById('paypal-plan-id');
const paymentStatusDiv = document.getElementById('payment-status');
const paypalButtonContainer = document.getElementById('paypal-button-container');

// --- Step 1: Get email from URL --- 
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    if (email) {
        emailInput.value = email;
        renderPayPalButton(); // Render button only if email is present
    } else {
        // Handle case where email is missing
        console.error('Email parameter missing from URL');
        paymentStatusDiv.textContent = 'Error: Email is missing. Please return to the app and try again.';
    }
});

// --- Step 2: Render PayPal Button --- 
function renderPayPalButton() {
    const planId = paypalPlanIdInput.value;
    if (!planId || planId === 'YOUR_PAYPAL_PLAN_ID') {
        paymentStatusDiv.textContent = 'Error: PayPal Plan ID is not configured.';
        return;
    }

    paypal.Buttons({
        // --- Step 3: createSubscription (Client-Side) --- 
        // Tells PayPal which plan the user is signing up for.
        createSubscription: function(data, actions) {
            console.log("Creating subscription for plan:", planId);
            return actions.subscription.create({
                'plan_id': planId
            });
        },

        // --- Step 4: onApprove (Client-Side) --- 
        // Called when the user approves the subscription in the PayPal popup.
        onApprove: async function(data, actions) {
            console.log('PayPal subscription approved:', data);
            paymentStatusDiv.textContent = 'Processing your subscription...';
            paypalButtonContainer.innerHTML = ''; // Clear the button

            const email = emailInput.value;
            const password = passwordInput.value;
            const paypalSubscriptionId = data.subscriptionID;

            if (!password) {
                 paymentStatusDiv.textContent = 'Error: Please enter a password before subscribing.';
                 renderPayPalButton(); // Re-render button if password was missing
                 return;
            }

            // --- Step 5: Call Your Backend to Finalize --- 
            // Send the email, password, and PayPal subscription ID to your server
            // Your server should: 
            // 1. Verify the subscription with PayPal using the subscriptionID.
            // 2. Create the user account in your system (e.g., Firebase Auth + Firestore).
            // 3. Store the paypalSubscriptionId with the user record.
            // 4. Redirect the user back to the app (success).
            try {
                // **IMPORTANT:** Replace with your actual backend endpoint URL
                const response = await fetch('/finalize-paypal-subscription', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        email: email,
                        password: password, // Send password securely (HTTPS is essential)
                        paypalSubscriptionId: paypalSubscriptionId
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to finalize subscription on server.');
                }

                // --- Step 6: Handle Success --- 
                const result = await response.json();
                paymentStatusDiv.textContent = 'Subscription successful! Redirecting back to the app...';
                console.log('Server response:', result);
                
                // Redirect back to the app using the deep link
                // Make sure your backend provides this or construct it here
                // Example: window.location.href = 'myebookapp://subscription/success';
                // Replace with the actual success URL/deep link
                window.location.href = result.redirectUrl || 'myebookapp://subscription/success'; 

            } catch (error) {
                console.error('Error finalizing subscription:', error);
                paymentStatusDiv.textContent = `Error: ${error.message}. Please contact support.`;
                // Optionally, inform the user and provide guidance
            }
        },

        // --- Optional: Handle Errors --- 
        onError: function(err) {
            console.error('PayPal Button Error:', err);
            paymentStatusDiv.textContent = 'An error occurred with PayPal. Please try again.';
            // Re-render the button potentially
             renderPayPalButton();
        },
        
        // --- Optional: Handle Cancellation --- 
        onCancel: function(data) {
            console.log('PayPal subscription cancelled:', data);
            paymentStatusDiv.textContent = 'Subscription cancelled.';
            // Maybe redirect back to the app's cancel state?
            // window.location.href = 'myebookapp://subscription/cancel';
        }

    }).render('#paypal-button-container').catch(err => {
         console.error('Failed to render PayPal Buttons:', err);
         paymentStatusDiv.textContent = 'Could not load PayPal payment options. Please refresh or contact support.';
    });
} 