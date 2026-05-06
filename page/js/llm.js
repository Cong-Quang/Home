/**
 * Puter AI Chat - Premium Multi-modal Logic (Extended File Support & Persistence)
 */

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const modelSearch = document.getElementById('modelSearch');
    const modelSelect = document.getElementById('modelSelect');
    const chatWindow = document.getElementById('chatWindow');
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const sendIcon = document.getElementById('sendIcon');
    const loadingSpinner = document.getElementById('loadingSpinner');

    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const filePreviewContainer = document.getElementById('filePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const docPreview = document.getElementById('docPreview');
    const docName = document.getElementById('docName');
    const docIcon = document.getElementById('docIcon');
    const removeFileBtn = document.getElementById('removeFileBtn');

    const sidebar = document.getElementById('sidebar');
    const toggleSidebar = document.getElementById('toggleSidebar');
    const overlay = document.getElementById('overlay');
    const clearChatBtn = document.getElementById('clearChat');

    let allModels = [];
    let chatHistory = [];
    let selectedImageBase64 = null;
    let extractedFileText = null;
    let currentFileName = null;

    // LOCAL STORAGE KEYS
    const STORAGE_KEY_HISTORY = 'puter_ai_chat_history';
    const STORAGE_KEY_MODEL = 'puter_ai_chat_selected_model';

    // Set PDF.js worker
    if (window['pdfjs-dist/build/pdf']) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    // SYSTEM RULES
    const SYSTEM_PROMPT = `Bạn là trợ lý AI cao cấp của Công Quang.
Quy tắc:
1. Trả lời bằng tiếng Việt chuyên nghiệp, tinh tế.
2. Sử dụng Markdown để trình bày đẹp mắt.
3. Nếu người dùng gửi tài liệu (PDF, Word, Text), hãy phân tích nội dung đó để trả lời.
4. Bạn có khả năng phân tích hình ảnh chuyên sâu.`;

    // Sidebar Logic
    function toggleMobileSidebar() {
        sidebar.classList.toggle('-translate-x-full');
        overlay.classList.toggle('hidden');
    }

    if (toggleSidebar) toggleSidebar.addEventListener('click', toggleMobileSidebar);
    if (overlay) overlay.addEventListener('click', toggleMobileSidebar);

    // Auto-resize textarea
    userInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    /**
     * Persist History to LocalStorage
     */
    function saveToStorage() {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(chatHistory));
        localStorage.setItem(STORAGE_KEY_MODEL, modelSelect.value);
    }

    /**
     * Load History from LocalStorage
     */
    function loadFromStorage() {
        const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
        if (savedHistory) {
            try {
                chatHistory = JSON.parse(savedHistory);
                // Clear the welcome message if we have history
                if (chatHistory.length > 0) {
                    chatWindow.innerHTML = '';
                    chatHistory.forEach(msg => {
                        if (msg.role === 'user') {
                            // Find image in content if exists
                            let imgUrl = null;
                            let text = "";
                            if (Array.isArray(msg.content)) {
                                msg.content.forEach(c => {
                                    if (c.type === 'text') text = c.text;
                                    if (c.type === 'image_url') imgUrl = c.image_url.url;
                                });
                            } else {
                                text = msg.content;
                            }
                            appendMessage('user', text, imgUrl);
                        } else if (msg.role === 'assistant') {
                            appendMessage('ai', msg.content);
                        }
                    });
                }
            } catch (e) {
                console.error("Lỗi load history:", e);
                chatHistory = [];
            }
        }
    }

    /**
     * PDF Text Extraction
     */
    async function extractPdfText(data) {
        const loadingTask = pdfjsLib.getDocument({ data });
        const pdf = await loadingTask.promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(s => s.str).join(' ') + "\n";
        }
        return fullText;
    }

    /**
     * Word (.docx) Extraction
     */
    async function extractDocxText(arrayBuffer) {
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    }

    /**
     * Handle File selection
     */
    async function handleFile(file) {
        if (!file) return;
        selectedImageBase64 = null;
        extractedFileText = null;
        currentFileName = file.name;
        imagePreview.classList.add('hidden');
        docPreview.classList.add('hidden');
        filePreviewContainer.classList.remove('hidden');

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                selectedImageBase64 = e.target.result;
                imagePreview.src = selectedImageBase64;
                imagePreview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf') {
            docIcon.textContent = '📕';
            docName.textContent = file.name;
            docPreview.classList.remove('hidden');
            const arrayBuffer = await file.arrayBuffer();
            extractedFileText = await extractPdfText(arrayBuffer);
        } else if (file.name.endsWith('.docx')) {
            docIcon.textContent = '📘';
            docName.textContent = file.name;
            docPreview.classList.remove('hidden');
            const arrayBuffer = await file.arrayBuffer();
            extractedFileText = await extractDocxText(arrayBuffer);
        } else {
            docIcon.textContent = '📄';
            docName.textContent = file.name;
            docPreview.classList.remove('hidden');
            extractedFileText = await file.text();
        }
    }

    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    removeFileBtn.addEventListener('click', () => {
        selectedImageBase64 = null;
        extractedFileText = null;
        filePreviewContainer.classList.add('hidden');
        fileInput.value = '';
    });

    document.addEventListener('paste', (e) => {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (const item of items) {
            if (item.type.indexOf('image') !== -1) handleFile(item.getAsFile());
        }
    });

    function appendMessage(role, text, imageUrl = null, fileName = null) {
        const div = document.createElement('div');
        const isUser = role === 'user';
        div.className = `flex ${isUser ? 'justify-end' : 'justify-start'} animate-in mb-6 last:mb-0`;

        const bubbleClass = isUser
            ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-blue-200'
            : 'bg-white text-slate-800 rounded-2xl rounded-tl-sm border border-slate-100 shadow-slate-100';

        let contentHtml = '';
        if (imageUrl) contentHtml += `<img src="${imageUrl}" class="chat-image" onclick="window.open('${imageUrl}')">`;
        if (fileName && !imageUrl) contentHtml += `<div class="flex items-center gap-2 mb-2 p-2 bg-white/10 rounded-lg border border-white/20 text-xs font-bold"><span class="text-xl">📄</span> ${fileName}</div>`;

        // Clean up text if it contains the internal [Nội dung từ file] prefix for clean display
        let displayText = text;
        if (isUser && text.startsWith('[Nội dung từ file:')) {
            const parts = text.split('\n---\n');
            displayText = parts[parts.length - 1].replace('Câu hỏi người dùng: ', '');
        }

        const textHtml = isUser
            ? `<div class="text-sm md:text-base leading-relaxed whitespace-pre-wrap">${displayText}</div>`
            : `<div class="prose max-w-none">${marked.parse(text)}</div>`;

        div.innerHTML = `
            <div class="max-w-[85%] md:max-w-[70%]">
                <div class="flex items-center gap-2 mb-1 ${isUser ? 'justify-end' : 'justify-start'}">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">${isUser ? 'Bạn' : 'AI Assistant'}</span>
                </div>
                <div class="${bubbleClass} p-4 shadow-lg message-bubble">
                    ${contentHtml}
                    ${textHtml}
                </div>
            </div>
        `;

        chatWindow.appendChild(div);
        chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: 'smooth' });
    }

    async function loadModels() {
        try {
            const rawModels = await puter.ai.listModels();
            allModels = rawModels.filter(m => (m.id || m.model || m.key || m.name) && String(m.id).toLowerCase() !== 'undefined');
            renderModels(allModels);

            const savedModel = localStorage.getItem(STORAGE_KEY_MODEL);
            if (savedModel && allModels.some(m => (m.id || m.model || m.key) === savedModel)) {
                modelSelect.value = savedModel;
            } else {
                // Ưu tiên GPT-5 làm mặc định cho người dùng mới
                const best = allModels.find(m => {
                    const id = (m.id || m.model || m.key).toLowerCase();
                    return id.includes('gpt-5') || id.includes('gpt-4o') || id.includes('gemini-1.5-flash');
                });
                if (best) modelSelect.value = best.id || best.model || best.key;
            }
        } catch (e) { console.error(e); }
    }

    function renderModels(models) {
        modelSelect.innerHTML = models.map(m => {
            const id = m.id || m.model || m.key;
            return `<option value="${id}">${m.name || id} (${m.provider || 'AI'})</option>`;
        }).join('');
    }

    modelSearch.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        renderModels(allModels.filter(m =>
            (m.id || m.model || m.key).toLowerCase().includes(term) ||
            (m.name || '').toLowerCase().includes(term)
        ));
    });

    modelSelect.addEventListener('change', saveToStorage);

    clearChatBtn.addEventListener('click', () => {
        if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện?")) {
            chatHistory = [];
            localStorage.removeItem(STORAGE_KEY_HISTORY);
            location.reload();
        }
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = userInput.value.trim();
        const currentImg = selectedImageBase64;
        const currentExtractedText = extractedFileText;
        const currentFileNameRef = currentFileName;

        if ((!text && !currentImg && !currentExtractedText) || sendBtn.disabled) return;

        appendMessage('user', text, currentImg, currentExtractedText ? currentFileNameRef : null);

        let fullUserPrompt = text;
        if (currentExtractedText) {
            fullUserPrompt = `[Nội dung từ file: ${currentFileNameRef}]\n---\n${currentExtractedText}\n---\nCâu hỏi người dùng: ${text || "Hãy phân tích tài liệu này"}`;
        }

        userInput.value = '';
        userInput.style.height = 'auto';
        selectedImageBase64 = null;
        extractedFileText = null;
        currentFileName = null;
        filePreviewContainer.classList.add('hidden');

        let userContent = [];
        if (currentImg) {
            userContent.push({ type: 'text', text: fullUserPrompt });
            userContent.push({ type: 'image_url', image_url: { url: currentImg } });
        } else {
            userContent = fullUserPrompt;
        }

        chatHistory.push({ role: 'user', content: userContent });
        saveToStorage();

        sendBtn.disabled = true;
        sendIcon.classList.add('hidden');
        loadingSpinner.classList.remove('hidden');

        try {
            const response = await puter.ai.chat([{ role: 'system', content: SYSTEM_PROMPT }, ...chatHistory], { model: modelSelect.value });
            const aiText = response?.message?.content || response?.content || JSON.stringify(response);
            appendMessage('ai', aiText);
            chatHistory.push({ role: 'assistant', content: aiText });
            saveToStorage();
        } catch (err) {
            appendMessage('error', "Lỗi: " + err.message);
        } finally {
            sendBtn.disabled = false;
            sendIcon.classList.remove('hidden');
            loadingSpinner.classList.add('hidden');
            userInput.focus();
        }
    });

    // Initialize
    loadModels();
    loadFromStorage();
});
