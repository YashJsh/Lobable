import {type  ToolDefiniton } from "../harness/harness.types";

const toolsDefinition: ToolDefiniton[] = [
  {
    type: "function",
    function: {
      name: "sub_agent",
      description:
        "You can use this tool to execute a sub-agent who can do specific work for you.",
      parameters: {
        type: "object",
        properties: {
          task: {
            type: "string",
            description: "The task to execute",
          },
          description: {
            type: "string",
            description : "The detailed description of the task to execute."
          }
        },
        required: ["task", "description"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ask_questions",
      description:
        "This tool asks the questions to the user for the project to get the better understanding.",
      parameters: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "The question we want to ask the user",
          },
        },
        required: ["question"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_todo",
      description:
        "This creates a todo according to the query for planning.",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "The prompt to create todo from",
          },
        },
        required: ["prompt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "This tool reads the content of a file.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The path to the file to read",
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_files",
      description: "This tool gives the list of files exists in the project",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The path to the file to read",
          },
        },
        required: ["path"],
      },
    },
  },
];

const subAgentToolDefinition: ToolDefiniton[] = [
{
    type: "function",
    function: {
      name: "bash_tool",
      description: "This tool runs a bash command and returns the result.",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "The bash command to run",
          },
        },
        required: ["command"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "This tool reads the content of a file.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The path to the file to read",
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "This tool writes the content to a file.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The path of the file to write",
          },
          content: {
            type: "string",
            description: "The content to write to the file",
          },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "editTool",
      description: "This tools edits a file",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description : "This path of the file"
          },
          old_str: {
            type: "string",
            description : "Exact contents of the file to replace"
          },
          new_str: {
            type: "string",
            description : "New content of the file to replace with old ones."
          }
        },
        required : ["path", "old_str", "new_str"]
      }
    }
  }
]


export {
  toolsDefinition,
  subAgentToolDefinition
};