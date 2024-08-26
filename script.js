const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const toggleThemeBtn = document.querySelector("#toggle-theme-btn");
const deletechatBtn = document.querySelector('#delete-chat-btn');
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");



let userMessage = null;
let isResponseGenerating = false;
const API_KEY = "AIzaSyCBJDAvZdVeQxk59xM-47r2pZvgtBd_zyo"
const API_Url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;





//create a new msg element and return it
const createMessageElement = (content,...classes)=>{
    const div = document.createElement("div")
    div.classList.add("message",...classes);
    div.innerHTML = content;
    return div;
}

//apply data from storage
const loadLocalStorageData = ()=>{
    const savedChats = localStorage.getItem("savedChats")
    const isLightMode = (localStorage.getItem("themeColor") === "light_mode");
    
    //apply the stored theme
    document.body.classList.toggle("light_mode",isLightMode);
    toggleThemeBtn.innerText = isLightMode ? "dark_mode" : "light_mode";
    
    //restore saved chats
    chatList.innerHTML = savedChats || "";

    document.body.classList.toggle("hide-header",savedChats);
    chatList.scrollTo(0,chatList.scrollHeight);
}

loadLocalStorageData();


//typing effect
const showTypingEffect = (text,textElement,incomingMessageDiv)=>{
    const words = text.split(' ');
    let currentWordIndex = 0;
    
    const typingInterval = setInterval(()=>{
        //append each word to the text element with space
          textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];
          incomingMessageDiv.querySelector(".icon").classList.add("hide");
        
          //if all words are displayed then
        if(currentWordIndex === words.length){
            clearInterval(typingInterval);
            isResponseGenerating = false;
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            localStorage.setItem("savedChats",chatList.innerHTML);//chat will be saved
            chatList.scrollTo(0,chatList.scrollHeight);//scroll to bottom;
        }
        chatList.scrollTo(0,chatList.scrollHeight);//scroll to bottom;
    },75);
}


const generateAPIResponse = async(incomingMessageDiv)=>{
    const  textElement = incomingMessageDiv.querySelector(".text");//get text element
    

    // sending post request through api with user msg
   try{
     const response = await fetch(API_Url,{
        method: "POST",
        headers: {"Content-type" : " application/json"},
         body:JSON.stringify({
            contents: [{
                 role:"user",
                 parts:[{text:userMessage}]
            }]
         })
     });

     const data = await response.json();
     if(!response.ok) throw new Error(data.error.message);

     //get the api response text
     const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g,'$1');
     showTypingEffect(apiResponse,textElement,incomingMessageDiv);
   }catch(error){
    isResponseGenerating = false;
    textElement.innerText = error.message;
    textElement.classList.add("error");
    console.log(error);
   }
   finally{
    incomingMessageDiv.classList.remove("loading");
   }
}


//show loading animation while waiting for api response
const showLoadingAnimation = ()=>{
    const html = `<div class="message-content">
            <img src="gemini.svg" alt="gemini image" class="avatar">
            <p class="text"></p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
        </div>  
        <span onclick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span> -->`;

const incomingMessageDiv = createMessageElement(html,"incoming","loading");

chatList.appendChild(incomingMessageDiv);

chatList.scrollTo(0,chatList.scrollHeight);

generateAPIResponse(incomingMessageDiv);
}


//copy icon handling
const copyMessage = (copyIcon)=>{
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;
    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done";
    setTimeout(() => {
        copyIcon.innerText = "content_copy";
    }, 1000);


}


//handle sending outgoing chat msgs
const  handleOutgoingChat = ()=>{
   userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage; 

   if(!userMessage || isResponseGenerating) return;

   isResponseGenerating = true;

   const html = `<div class="message-content">
            <img src="user.jpg" alt="user image" class="avatar">
            <p class="text"></p>
        </div>`;
    const outgoingMessageDiv = createMessageElement(html,"outgoing");
    outgoingMessageDiv.querySelector(".text").innerText = userMessage;
    chatList.appendChild(outgoingMessageDiv);

    typingForm.reset();
    chatList.scrollTo(0,chatList.scrollHeight);
    document.body.classList.add("hide-header");//hide the header once chat start
    setTimeout(showLoadingAnimation,500);//show loading animation after delay

}


//set user msg and handle outgoing chat when suggestion is clicked
suggestions.forEach(suggestion => {
    suggestion.addEventListener("click",()=>{
        userMessage = suggestion.querySelector(".text").innerText;
        handleOutgoingChat();
    });
});
//dark-light mode toggeling
toggleThemeBtn.addEventListener("click",()=>{
    const isLightMode = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
    toggleThemeBtn.innerText = isLightMode ? "dark_mode" : "light_mode";
})

//delete all chats frm local storage
deletechatBtn.addEventListener("click",()=>{
    if(confirm("are you sure you want to delete this chat")){
        localStorage.removeItem("savedChats");
        loadLocalStorageData();
    }
})

//prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit",(e)=>{
    e.preventDefault();

    handleOutgoingChat();
})

 
