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


const otpSection = document.getElementById("otpSection");
const otpInput = document.getElementById("otpInput");
const verifyOtpButton = document.getElementById("verifyOtpButton");

let loginEmailForOtp = "";

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

    loginEmailForOtp = email;

    showMessage("Sending OTP to your email...", "info");

    try {
       const { error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
        shouldCreateUser: false,
        emailRedirectTo: "https://x-a45.github.io/uoh-market/auth.html"
    }
});

        if (error) {
            console.error("OTP error:", error);
            showMessage(error.message, "error");
            return;
        }

        loginForm.style.display = "none";
        otpSection.style.display = "block";

        showMessage(
            "OTP sent! Check your UoH email.",
            "success"
        );

        otpInput.focus();

    } catch (error) {
        console.error(error);

        showMessage(
            "Could not send OTP. Please try again.",
            "error"
        );
    }
});

verifyOtpButton.addEventListener("click", async () => {

    const token = otpInput.value.trim();

    if (!/^\d{8}$/.test(token)) {
        showMessage(
            "Please enter the 6-digit OTP.",
            "error"
        );
        return;
    }

    showMessage("Verifying OTP...", "info");

    try {

        const { data, error } =
            await supabase.auth.verifyOtp({
                email: loginEmailForOtp,
                token: token,
                type: "email"
            });

        if (error) {
            console.error("OTP verification error:", error);

            showMessage(
                error.message,
                "error"
            );

            return;
        }

        if (!data.session) {
            showMessage(
                "Login could not be completed. Please try again.",
                "error"
            );

            return;
        }

        showMessage(
            "Login successful! Redirecting...",
            "success"
        );

        setTimeout(() => {
            window.location.href = "index.html";
        }, 800);

    } catch (error) {

        console.error(error);

        showMessage(
            "Invalid OTP. Please try again.",
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
