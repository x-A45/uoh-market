import { supabase } from "./supabaseClient.js";

const loginButton = document.querySelector(".login-btn");
const browseItemsButton =
    document.getElementById("browseItemsBtn");

const sellButtons = [
    ...document.querySelectorAll(".sell-btn"),
    ...document.querySelectorAll(".secondary-btn"),
    ...document.querySelectorAll(".sell-section .primary-btn")
];

const listingGrid = document.getElementById("listingGrid");


/* ================================
   AUTHENTICATION
================================ */

async function setupAuthUI() {

    const {
        data: { user },
        error
    } = await supabase.auth.getUser();

    if (error) {
        console.error("Auth check failed:", error);
        return;
    }

    if (user) {

        const fullName =
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "Student";

        loginButton.textContent = `👤 ${fullName}`;
        loginButton.href = "account.html";

        sellButtons.forEach((button) => {

            button.addEventListener("click", () => {
                window.location.href = "sell.html";
            });

        });

        console.log("✅ Logged in as:", fullName);

    } else {

        console.log("ℹ️ No user is logged in.");

        sellButtons.forEach((button) => {

            button.addEventListener("click", () => {
                window.location.href = "auth.html";
            });

        });
    }
}


/* ================================
   LOAD REAL LISTINGS
================================ */

async function loadListings() {

    if (!listingGrid) {
        return;
    }

    listingGrid.innerHTML = `
        <p class="loading-listings">
            Loading listings...
        </p>
    `;


    const { data: listings, error } = await supabase

        .from("listings")

        .select(`
            id,
            title,
            description,
            category,
            condition,
            price,
            hostel,
            status,
            created_at,

            listing_images (
                image_url,
                display_order
            )
        `)

        .eq("status", "available")

        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.error(
            "Failed to load listings:",
            error
        );

        listingGrid.innerHTML = `
            <p class="loading-listings">
                Unable to load listings right now.
            </p>
        `;

        return;
    }


    if (!listings || listings.length === 0) {

        listingGrid.innerHTML = `
            <p class="loading-listings">
                No listings available yet.
            </p>
        `;

        return;
    }


    listingGrid.innerHTML = "";


    listings.forEach((listing) => {

        const images =
            listing.listing_images || [];


        const sortedImages =
            [...images].sort(
                (a, b) =>
                    (a.display_order ?? 0) -
                    (b.display_order ?? 0)
            );


        const firstImage =
            sortedImages[0];


        const card =
            document.createElement("article");

        card.className =
            "listing-card";


        const imageHTML = firstImage

            ? `
                <img
                    src="${escapeHTML(firstImage.image_url)}"
                    alt="${escapeHTML(listing.title)}"
                    class="real-listing-image"
                >
            `

            : `
                <div class="listing-image">
                    📦
                </div>
            `;


        card.innerHTML = `

            ${imageHTML}

            <div class="listing-info">

                <span class="listing-category">
                    ${escapeHTML(listing.category)}
                </span>


                <h3>
                    ${escapeHTML(listing.title)}
                </h3>


                <p>
                    ${escapeHTML(
                        listing.description ||
                        "No description provided."
                    )}
                </p>


                <div class="listing-bottom">

                    <strong>
                        ₹${Number(
                            listing.price
                        ).toLocaleString("en-IN")}
                    </strong>


                    <span>
                        📍 ${escapeHTML(
                            listing.hostel
                        )}
                    </span>

                </div>

            </div>
        `;


        listingGrid.appendChild(card);

    });
}


/* ================================
   SECURITY
================================ */

function escapeHTML(value) {

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");
}


/* ================================
   START APP
================================ */

if (browseItemsButton) {
    browseItemsButton.addEventListener("click", () => {

        document
            .getElementById("marketplace")
            .scrollIntoView({
                behavior: "smooth"
            });

    });
}

setupAuthUI();

loadListings();