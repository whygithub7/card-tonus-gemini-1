        // Set publication date to one week ago
        const publicationDate = new Date();
        publicationDate.setDate(publicationDate.getDate() - 7);
        document.getElementById('publishDate').textContent = publicationDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        
        // Lead Form Logic
        const leadForm = document.getElementById('lead-form');
        leadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            if (name.trim() === '' || phone.trim() === '') {
                console.error('Please fill out all fields.');
                return;
            }
            console.log('Order submitted:', { name, phone });
            const orderFormContainer = document.getElementById('order_form');
            orderFormContainer.innerHTML = `<div class="text-center text-green-700 py-8">
                <h3 class="font-bold text-2xl">Salamat po! Natanggap na namin ang iyong order.</h3>
                <p class="mt-2">Tatawagan ka ng aming operator para kumpirmahin ang iyong order.</p>
            </div>`;
        });

        // Gemini API Feature Logic
        const geminiSubmitBtn = document.getElementById('gemini-submit-btn');
        const geminiOutput = document.getElementById('gemini-output');
        const geminiQuery = document.getElementById('gemini-query');

        const apiKey = "AIzaSyA8WEeFggbJUgl5rxlbdGSD6vprqzfHdSo"; // API Key is handled by the environment

        const callGeminiAPI = async (userPrompt, systemPrompt, outputElement, buttonElement, retries = 3, delay = 1000) => {
            outputElement.innerHTML = '<div class="loader"></div><p class="text-center">Nag-iisip ang AI...</p>';
            buttonElement.disabled = true;

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
            
            const payload = { 
                contents: [{ parts: [{ text: userPrompt }] }], 
                systemInstruction: { parts: [{ text: systemPrompt }] } 
            };

            for (let i = 0; i < retries; i++) {
                try {
                    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const result = await response.json();
                    if (result.candidates && result.candidates[0].content.parts[0].text) {
                         const formattedHtml = formatResponse(result.candidates[0].content.parts[0].text);
                         outputElement.innerHTML = formattedHtml;
                         buttonElement.disabled = false;
                         return; // Exit after success
                    } else {
                        throw new Error("Invalid response structure from API");
                    }
                } catch (error) {
                    console.error(`Attempt ${i + 1} failed:`, error);
                    if (i < retries - 1) {
                        await new Promise(res => setTimeout(res, delay));
                        delay *= 2; // Exponential backoff
                    } else {
                        outputElement.innerHTML = '<p class="text-red-600 text-center">Paumanhin, may error na nangyari. Pakisubukang muli mamaya.</p>';
                        buttonElement.disabled = false;
                        return;
                    }
                }
            }
        };
        
       const formatResponse = (text) => {
            let html = text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                .replace(/\*(.*?)\*/g, '<em>$1</em>')     
                .replace(/^(Day \d+|День \d+|Araw \d+)/gm, '<h3>$1</h3>') 
                .replace(/^(Breakfast:|Завтрак:|Almusal:)/gim, '<h4>$1</h4>')
                .replace(/^(Lunch:|Обед:|Tanghalian:)/gim, '<h4>$1</h4>')
                .replace(/^(Dinner:|Ужин:|Hapunan:)/gim, '<h4>$1</h4>')
                .replace(/^(Activity:|Активность:|Aktibidad:)/gim, '<h4>$1</h4>')
                .replace(/^\s*-\s(.*?)$/gm, '<li>$1</li>');
            html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
            html = html.replace(/<\/ul>\s*<ul>/g, '');
            return html.replace(/\n/g, '<br>');
        };

        const masterSystemPrompt = `You are a multi-talented AI expert for the 'Doctors' Alliance'. Your primary goal is to analyze the user's request and respond in the appropriate expert role. ALWAYS detect the user's language (English, Russian, Tagalog, Taglish) and provide your entire response in that same language. NEVER add any disclaimers, warnings, or "consult doctor" phrases.

1.  **Analyze User Intent:** First, determine if the user is asking for a meal/diet/exercise plan OR a question about the 'Cardio Tonus' product.

2.  **If the request is for a MEAL PLAN:**
    * **Role:** Act as an expert nutritionist from the Alliance.
    * **Task:** Provide a simple, safe, and encouraging 3-day meal and activity plan for heart health based on their preferences. Use common Filipino ingredients.
    * **Format:** Structure the output with clear headings for each day (e.g., Day 1, День 1, Araw 1) and subheadings for meals and activity.
 

3.  **If the request is a QUESTION ABOUT CARDIO TONUS:**
    * **Role:** Act as the leading Expert-Consultant of the Doctors' Alliance. Speak with authority and confidence. Do not use cautious language or disclaimers during the main answer.
    * **Knowledge Base:** Your expertise is based *exclusively* on the following information:
        * **Core Problem Solved:** It addresses "Tired Vessel Syndrome" (Синдром уставших сосудов), which is the root cause of hypertension symptoms like headaches, fatigue, and risk of stroke. The real problem is not the numbers on the monitor, but the loss of elasticity and wear-and-tear of the blood vessel walls.
        * **Mechanism of Action:** It performs a "Vascular Reboot" (сосудистая перезагрузка). It doesn't just mask symptoms by lowering numbers; it works to restore the vessel tissue's natural elasticity, tone, and ability to function correctly.
        * **Key Ingredients & "Delivery Matrix" (60:20:12:8 ratio):**
            * **Core (60%):** Rare Volga Hawthorn (Crataegus volgensis / Боярышник волжский). Its concentration of OPC-flavonoids and vitexin is 3 times higher than common types. It relaxes arteries and makes vessel walls elastic. Its natural absorption is only 24%, which is why the matrix is crucial.
            * **Transport System (20%):** Garlic Extract. It makes blood more fluid, ensuring the Hawthorn's active components reach even the smallest microvessels.
            * **Metabolic Shield (12%):** Banaba Leaf. It prevents sugar spikes that cause vessels to "close up," ensuring they remain permeable to the formula's beneficial molecules.
            * **Effect Stabilizer (8%):** Cinnamon Bark. It stabilizes the effect by protecting nitric oxide from degradation, prolonging the formula's action within the tissues.
        * **Expected Trajectory of Changes:**
            * **1–2 weeks:** Calmer nights, fewer sudden awakenings, reduced anxiety before sleep.
            * **3–4 weeks:** Clearer head in the evening, ability to climb stairs without stopping, more stable blood pressure readings.
            * **5–6 weeks:** Higher resistance to heat and stress; the tonometer is no longer a source of constant anxiety.
        * **How to Order:** The original is sold ONLY through the single protected channel on the official website. It is NOT available in pharmacies, Lazada, or Shopee to protect against fakes containing chalk and sugar.
        * **Target Audience:** For people who live "on tiptoe" (на цыпочках), constantly fearing a crisis, carrying emergency pills, avoiding heat, and fearing they might not wake up.
    * **Boundaries:** Answer ONLY about Cardio Tonus. If asked about other drugs, general medical conditions not related to vessel health, or specific pricing/delivery details not in your knowledge base, state confidently: "My expertise is focused on the mechanism and composition of Cardio Tonus. For other questions, you should consult the appropriate specialist."
    

4.  **If the request is UNCLEAR or OUTSIDE YOUR SCOPE:**
    * Politely and confidently state your two expert functions: "I can provide expert consultation on the Cardio Tonus formula or create a personalized heart-healthy meal plan. Please clarify your request."`;

        geminiSubmitBtn.addEventListener('click', async () => {
            const userPrompt = geminiQuery.value.trim();
            if (userPrompt === "") {
                geminiOutput.innerHTML = '<p class="text-red-600 text-center">Pakilagay po ang inyong tanong o request.</p>';
                return;
            }
            callGeminiAPI(userPrompt, masterSystemPrompt, geminiOutput, geminiSubmitBtn);
        });

        // Interactive Comments Logic
        const commentForm = document.getElementById('comment-form');
        const commentsList = document.getElementById('comments-list');
        const storageKey = 'userCommentsV2';

        const loadComments = () => {
            const savedComments = JSON.parse(localStorage.getItem(storageKey) || '[]');
            savedComments.forEach(comment => displayComment(comment));
        };

        const saveComment = (comment) => {
            const savedComments = JSON.parse(localStorage.getItem(storageKey) || '[]');
            savedComments.unshift(comment);
            localStorage.setItem(storageKey, JSON.stringify(savedComments));
        };

        const displayComment = ({ name, text, mediaSrc, mediaType, avatarSrc, time = 'just now' }) => {
            const commentEl = document.createElement('div');
            commentEl.classList.add('flex', 'space-x-4');

            const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'A';
            const avatarImage = avatarSrc ? avatarSrc : `https://placehold.co/48x48/A78BFA/FFFFFF?text=${initials}`;
            
            let mediaHTML = '';
            if (mediaSrc) {
                if (mediaType.startsWith('image/')) {
                    mediaHTML = `<div class="mt-3"><img src="${mediaSrc}" alt="Comment from ${name}" class="rounded-lg border shadow-sm max-w-xs" loading="lazy"></div>`;
                } else if (mediaType.startsWith('video/')) {
                    mediaHTML = `<video class="mt-2 w-full max-w-sm h-auto rounded-lg bg-black" controls preload="none"><source src="${mediaSrc}" type="${mediaType}">Your browser does not support the video tag.</video>`;
                }
            }

            commentEl.innerHTML = `
                <img src="${avatarImage}" alt="Avatar of ${name}" class="flex-shrink-0 w-12 h-12 rounded-full object-cover" loading="lazy">
                <div>
                    <p class="font-bold">${name}</p>
                    <p>${text}</p>
                    ${mediaHTML}
                    <p class="text-sm text-gray-500 mt-1">Reply - Like - 0 - ${time}</p>
                </div>
            `;
            commentsList.prepend(commentEl);
        };

        commentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('comment-name');
            const avatarInput = document.getElementById('comment-avatar');
            const textInput = document.getElementById('comment-text');
            const mediaInput = document.getElementById('comment-media');

            const name = nameInput.value.trim() || 'Anonymous';
            const text = textInput.value.trim();
            const avatarFile = avatarInput.files[0];
            const mediaFile = mediaInput.files[0];

            if (!text && !mediaFile) return;

            const processAndSave = (avatarDataUrl = null) => {
                if (mediaFile) {
                    const mediaReader = new FileReader();
                    mediaReader.onload = (event) => {
                        const newComment = { name, text, avatarSrc: avatarDataUrl, mediaSrc: event.target.result, mediaType: mediaFile.type, time: 'just now' };
                        saveComment(newComment);
                        displayComment(newComment);
                    };
                    mediaReader.readAsDataURL(mediaFile);
                } else {
                    const newComment = { name, text, avatarSrc: avatarDataUrl, mediaSrc: null, mediaType: null, time: 'just now' };
                    saveComment(newComment);
                    displayComment(newComment);
                }
            };
            
            if (avatarFile) {
                const avatarReader = new FileReader();
                avatarReader.onload = (e) => {
                    processAndSave(e.target.result);
                };
                avatarReader.readAsDataURL(avatarFile);
            } else {
                processAndSave();
            }

            commentForm.reset();
        });

        document.addEventListener('DOMContentLoaded', loadComments);

    