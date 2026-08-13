import { supabase } from "./supabaseClient.js";

const loginView = document.getElementById("loginView");
const signupView = document.getElementById("signupView");

const showSignupButton = document.getElementById("showSignup");
const showLoginButton = document.getElementById("showLogin");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const message = document.getElementById("message");


function showMessage(text, type = "info") {
    message.textContent = text;
    message.className = `message ${type}`;
}


showSignupButton.addEventListener("click", () => {
    loginView.classList.add("hidden");
    signupView.classList.remove("hidden");

    showMessage("");
});


showLoginButton.addEventListener("click", () => {
    signupView.classList.add("hidden");
    loginView.classList.remove("hidden");

    showMessage("");
});






loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document
        .getElementById("loginEmail")
        .value
        .trim()
        .toLowerCase();

    if (!email.endsWith("@uohyd.ac.in")) {
        showMessage(
            "Please use your University of Hyderabad email.",
            "error"
        );
        return;
    }

    

   showMessage("Sending sign-in link to your email...", "info");

    try {
       const { error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
        shouldCreateUser: false,
        emailRedirectTo: "https://x-a45.github.io/uoh-market/auth.html"
    }
});

        if (error) {
            console.error("Sign-in link error:", error);
            showMessage(error.message, "error");
            return;
        }

       
    showMessage(
        "Sign-in link sent! Check your UoH email and click the link to continue.",
        "success"
    );

} catch (error) {
    console.error(error);

    showMessage(
        "Could not send sign-in link. Please try again.",
        "error"
    );
}
});  



signupForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    if (!email.toLowerCase().endsWith("@uohyd.ac.in")) {
    showMessage(
        "Please use your University of Hyderabad email (@uohyd.ac.in).",
        "error"
    );
    return;
}
    const password = document.getElementById("signupPassword").value;
    const confirmPassword =
        document.getElementById("signupConfirm").value;

    if (password !== confirmPassword) {
        showMessage("Passwords do not match.", "error");
        return;
    }

    showMessage("Creating your account...", "info");

    const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
        emailRedirectTo: "https://x-a45.github.io/uoh-market/auth.html",
        data: {
            full_name: name
        }
    }
});

    if (error) {
        console.error(error);
        showMessage(error.message, "error");
        return;
    }

    console.log("Signup response:", data);

    showMessage(
        "Account created. Check your email to verify your account.",
        "success"
    );

    signupForm.reset();
});
supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) {
        window.location.href = "index.html";
    }
});
