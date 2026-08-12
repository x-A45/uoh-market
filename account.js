import { supabase } from "./supabaseClient.js";

const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const avatar = document.getElementById("avatar");

const logoutButton =
    document.getElementById("logoutButton");

const myListingsButton =
    document.getElementById("myListingsButton");

const myListingsSection =
    document.getElementById("myListingsSection");

const myListingsGrid =
    document.getElementById("myListingsGrid");


async function loadAccount() {

    const {
        data: { user },
        error
    } = await supabase.auth.getUser();


    if (error || !user) {

        window.location.href = "auth.html";

        return;
    }


    const name =
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Student";


    userName.textContent = name;

    userEmail.textContent = user.email;

    avatar.textContent =
        name.charAt(0).toUpperCase();


    await loadMyListings(user.id);
}


async function loadMyListings(userId) {

    const { data, error } = await supabase
        .from("listings")
        .select(`
            id,
            title,
            description,
            category,
            price,
            hostel,
            status,
            listing_images (
                image_url,
                display_order
            )
        `)
        .eq("seller_id", userId)
        .order("created_at", {
            ascending: false
        });


    if (error) {

        console.error(error);

        myListingsGrid.innerHTML =
            "<p>Unable to load listings.</p>";

        return;
    }


    if (!data.length) {

        myListingsGrid.innerHTML =
            "<p>You haven't posted anything yet.</p>";

        return;
    }


    myListingsGrid.innerHTML = "";


    data.forEach((listing) => {

        const images =
            listing.listing_images || [];

        images.sort(
            (a, b) =>
                (a.display_order ?? 0) -
                (b.display_order ?? 0)
        );


        const image = images[0];


        const card =
            document.createElement("article");

        card.className = "listing-card";


        card.innerHTML = `

            ${
                image

                ? `
                    <img
                        src="${image.image_url}"
                        class="real-listing-image"
                    >
                `

                : `
                    <div class="listing-image">
                        📦
                    </div>
                `
            }


            <div class="listing-info">

                <span class="listing-category">
                    ${listing.category}
                </span>

                <h3>
                    ${listing.title}
                </h3>

                <p>
                    ₹${Number(
                        listing.price
                    ).toLocaleString("en-IN")}
                </p>

                <div class="listing-bottom">
                    <span>
                        📍 ${listing.hostel}
                    </span>

                    <span>
                        ${listing.status}
                    </span>
                </div>

            </div>
        `;


        myListingsGrid.appendChild(card);
    });
}


myListingsButton.addEventListener("click", () => {

    myListingsSection.classList.toggle("hidden");

    if (!myListingsSection.classList.contains("hidden")) {

        myListingsSection.scrollIntoView({
            behavior: "smooth"
        });

    }

});


logoutButton.addEventListener("click", async () => {

    await supabase.auth.signOut();

    window.location.href = "index.html";

});


loadAccount();