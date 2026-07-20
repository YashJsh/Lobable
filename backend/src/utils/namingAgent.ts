import Groq from "groq-sdk";

const client = new Groq();

const getProjectName = async (prompt : string)=>{
    const response = await client.chat.completions.create({
        messages : [
            {
                role : "system",
                content : "You are a naming agent. User will send a prompt. You have to return a project name from this. Example : user prompt : Build a todo-application. Your response should be- Todo-app"
            },
            {
                role : "user",
                content : prompt
            }
        ],
        model : "openai/gpt-oss-20b",
    })
    const res = response.choices[0]?.message.content;
    return res as string;
}

export {
    getProjectName
}