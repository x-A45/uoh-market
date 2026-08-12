import { supabase } from "./supabaseClient.js";

const sellForm = document.getElementById("sellForm");
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const formMessage = document.getElementById("formMessage");
const postButton = document.getElementById("postButton");

const description = document.getElementById("description");
const descriptionCount = document.getElementById("descriptionCount");

let selectedFiles = [];


function showMessage(text, type = "info") {
    formMessage.textContent = text;
    formMessage.className = `form-message ${type}`;
}


description.addEventListener("input", () => {
    descriptionCount.textContent = description.value.length;
});

imageInput.addEventListener("change", async () => {

    const incomingFiles = Array.from(imageInput.files);

    if (selectedFiles.length + incomingFiles.length > 3) {
        showMessage(
            "You can upload a maximum of 3 photos.",
            "error"
        );
        return;
    }

    showMessage("Preparing your photos...", "info");

    for (const file of incomingFiles) {

        if (!file.type.startsWith("image/")) {
            showMessage(
                `${file.name} is not an image.`,
                "error"
            );
            continue;
        }

        try {

            const compressedFile =
                await compressImage(file);

            selectedFiles.push(compressedFile);

        } catch (error) {

            console.error(
                "Image compression failed:",
                error
            );

            showMessage(
                `Could not process ${file.name}.`,
                "error"
            );
        }
    }

    renderPreviews();

    imageInput.value = "";

    showMessage(
        `${selectedFiles.length} photo(s) ready to upload.`,
        "success"
    );
});


    
async function compressImage(file) {

    const MAX_WIDTH = 1200;
    const MAX_HEIGHT = 1200;
    const TARGET_SIZE = 700 * 1024;

    const image = new Image();

    const objectUrl = URL.createObjectURL(file);

    image.src = objectUrl;

    await new Promise((resolve, reject) => {

        image.onload = resolve;
        image.onerror = reject;

    });

    let width = image.width;
    let height = image.height;


    // Resize while keeping the original aspect ratio

    if (width > MAX_WIDTH || height > MAX_HEIGHT) {

        const ratio = Math.min(
            MAX_WIDTH / width,
            MAX_HEIGHT / height
        );

        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
    }


    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    context.drawImage(
        image,
        0,
        0,
        width,
        height
    );


    URL.revokeObjectURL(objectUrl);


    // Start with good WebP quality

    let quality = 0.80;

    let blob = await canvasToBlob(
        canvas,
        "image/webp",
        quality
    );


    // Keep reducing quality until the image is small enough

    while (
        blob.size > TARGET_SIZE &&
        quality > 0.45
    ) {

        quality -= 0.05;

        blob = await canvasToBlob(
            canvas,
            "image/webp",
            quality
        );
    }


    const originalName =
        file.name
            .replace(/\.[^/.]+$/, "")
            .replace(/[^a-zA-Z0-9_-]/g, "_");


    return new File(
        [blob],
        `${originalName}.webp`,
        {
            type: "image/webp"
        }
    );
}


function canvasToBlob(
    canvas,
    type,
    quality
) {

    return new Promise((resolve, reject) => {

        canvas.toBlob(
            (blob) => {

                if (blob) {
                    resolve(blob);
                } else {
                    reject(
                        new Error(
                            "Image compression failed."
                        )
                    );
                }

            },
            type,
            quality
        );

    });
}
function renderPreviews() {

    imagePreview.innerHTML = "";

    selectedFiles.forEach((file, index) => {

        const wrapper = document.createElement("div");
        wrapper.className = "preview-item";

        const img = document.createElement("img");

        img.src = URL.createObjectURL(file);
        img.alt = "Selected listing photo";

        const removeButton = document.createElement("button");

        removeButton.type = "button";
        removeButton.className = "remove-image";
        removeButton.textContent = "×";

        removeButton.addEventListener("click", () => {

            selectedFiles.splice(index, 1);

            renderPreviews();
        });

        wrapper.appendChild(img);
        wrapper.appendChild(removeButton);

        imagePreview.appendChild(wrapper);
    });
}


async function ensureProfile(user) {

    const fullName =
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Student";

    const { error } = await supabase
        .from("profiles")
        .upsert(
            {
                id: user.id,
                full_name: fullName,
                email: user.email
            },
            {
                onConflict: "id"
            }
        );

    if (error) {
        throw error;
    }
}


async function uploadImages(files, listingId, userId) {

    const uploadedImages = [];

    for (let index = 0; index < files.length; index++) {

        const file = files[index];

        const safeName = file.name
            .replace(/[^a-zA-Z0-9._-]/g, "_");

        const filePath =
            `${userId}/${listingId}/${Date.now()}-${index}-${safeName}`;

        const { error: uploadError } = await supabase
            .storage
            .from("listing-images")
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: false
            });

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase
            .storage
            .from("listing-images")
            .getPublicUrl(filePath);

        uploadedImages.push({
            listing_id: listingId,
            image_url: data.publicUrl,
            display_order: index
        });
    }

    return uploadedImages;
}


async function checkUser() {

    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {

        window.location.href = "auth.html";

        return null;
    }

    return user;
}


sellForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    postButton.disabled = true;
    showMessage("Publishing your listing...", "info");

    try {

        const user = await checkUser();

        if (!user) {
            return;
        }

        await ensureProfile(user);


        const title =
            document.getElementById("title").value.trim();

        const category =
            document.getElementById("category").value;

        const condition =
            document.getElementById("condition").value;

        const price =
            Number(document.getElementById("price").value);

        const hostel =
            document.getElementById("hostel").value.trim();

        const descriptionValue =
            document.getElementById("description").value.trim();


        if (!title || !category || !condition || !hostel) {
            throw new Error("Please fill in all required fields.");
        }

        if (!Number.isFinite(price) || price < 0) {
            throw new Error("Please enter a valid price.");
        }


        const { data: listing, error: listingError } =
            await supabase
                .from("listings")
                .insert({
                    seller_id: user.id,
                    title,
                    description: descriptionValue,
                    category,
                    condition,
                    price,
                    hostel,
                    status: "available"
                })
                .select()
                .single();


        if (listingError) {
            throw listingError;
        }


        if (selectedFiles.length > 0) {

            const images = await uploadImages(
                selectedFiles,
                listing.id,
                user.id
            );


            const { error: imageDbError } =
                await supabase
                    .from("listing_images")
                    .insert(images);

            if (imageDbError) {
                throw imageDbError;
            }
        }


        showMessage(
            "✅ Your item has been posted successfully!",
            "success"
        );

        sellForm.reset();
        selectedFiles = [];
        renderPreviews();
        descriptionCount.textContent = "0";

        setTimeout(() => {
            window.location.href = "index.html";
        }, 1200);

    } catch (error) {

        console.error("Listing creation failed:", error);

        showMessage(
            error.message || "Something went wrong while posting.",
            "error"
        );

    } finally {

        postButton.disabled = false;
    }
});