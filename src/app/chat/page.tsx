"use client";

import { AutosizeTextarea } from "@/components/ui/autosize-textarea";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ScrollArea } from "@/components/ui/scroll-area";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusIcon } from "@radix-ui/react-icons";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Input } from "@/components/ui/input";
import { WorkmindClient } from "@workmind/client";

interface Message {
  message: String;
  type: "bot" | "user" | "status";
}

export default function Chat() {
  const scrollRef = useRef<null | HTMLDivElement>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [userInput, setUserInput] = useState("");
  const [conversation, setConversation] = useState<Message[]>([]);
  const [connected, setConnected] = useState<boolean>(false)
  const [connecting, setConnecting] = useState<boolean>(false)
  const [sessionId, setSessionId] = useState<string>()
  const [agentId, setAgentId] = useState<string>()
  const [client, setClient] = useState<WorkmindClient>(new WorkmindClient({
    baseUrl: "https://wm-gateway-613708618361.us-central1.run.app",
    agentId: "agents/adder.json"
  }))

  // Force state update based on client
  useEffect(() => {
    setSessionId(client.sessionId)
    setAgentId(client.agentId)
  }, [client.sessionId, client.agentId])

  useEffect(() => {
    const initialise = async () => {
      if (!connecting) {
        return
      }
      try {
        await client.handshake()
        addMessage({ message: "Connecting...", type: "status" });
        setConnecting(false)
        setConnected(true)

        console.log("Session:", sessionId);
        addMessage({ message: "Connected! Please give the bot some time to respond.", type: "status" });
        addMessage({ message: `Session ID: ${sessionId}`, type: "status" });
        console.log("Session:", client.sessionId);
        // todo: some kind of message to note the chat is connected and will reply

        client.startEventStream();
      } catch (err) {
        console.error("Handshake failed", err);
        addMessage({ message: "Handshake failed. Check console.", type: "bot" });
      }
    }
    initialise()
    // return () => {
    //   connection.disconnect();
    // };
  }, [connecting]);

  // Register on effects once.
  useEffect(() => {
    client.on("ui", (msg) => {
      // UI events from worker activities
      const text = msg?.payload?.message;
      if (text) addMessage({ message: text, type: "bot" });
    });

    client.on("error", (err) => {
      console.error("SSE error", err);
      addMessage({ message: "[connection error]", type: "bot" });
    });
  }, []);

  const handleConnect = async () => {
    setConnecting(true)
  }

  const handleDisconnect = () => {
    client.stopEventStream()
    addMessage({ message: `Session terminated.`, type: "status" });
    console.log("Disconnecting...");
    console.log("Session disconnected.");
    setConnected(false)
  }

  const addMessage = (message: Message) => {
    setConversation((oldArray: Message[]) => [...oldArray, message]);
    if (message.type === "user") {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      const messageEndPosition =
        messagesEndRef.current?.getBoundingClientRect()?.top || 0;
      const scrollAreaPosition =
        scrollRef.current?.getBoundingClientRect()?.top || 0;
      const scrollAreaHeight = scrollRef.current?.clientHeight || 0;
      const scrollPosition = messageEndPosition - scrollAreaPosition;
      if (scrollAreaHeight - scrollPosition >= -200) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  };

  const sendMessage = async () => {
    console.log("current sesssion id is: " + client.sessionId)
    if (userInput) {
      addMessage({ message: userInput, type: "user" });
      const text = userInput.trim()
      setUserInput(""); // clear the textarea

      try {
        await client.sendMessage("user_message", { text })
      } catch (err) {
        addMessage({ message: "Failed to send message.", type: "bot" })
        console.error(err)
      }
    }
  };

  const handleEnter = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <main className="h-screen flex flex-col bg-muted/50">
      <div>
        <div className="bg-white py-2 flex gap-3 justify-between items-center px-3">
          <div>
            <Link href="/">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M21 3l-5 9h5l-6.891 7.086a6.5 6.5 0 1 1 -8.855 -9.506l7.746 -6.58l-1 5l9 -5z" />
                <path d="M9.5 14.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0" />
              </svg>
            </Link>
          </div>

          <div className="flex w-full flex-wrap gap-2">
            <Input
              className="w-auto max-w-60 disabled:cursor-not-allowed"
              type="text"
              placeholder="Session ID"
              disabled={connected || connecting}
            />
            <Input
              className="w-auto max-w-60 disabled:cursor-not-allowed"
              type="text"
              placeholder="Agent ID"
              defaultValue={"agents/adder.json"}
              disabled={connected || connecting}
            />
            <div className="gap-x-2 flex">
              <Button
                disabled={connected || connecting}
                onClick={handleConnect}
              >
                Connect</Button>
              <Button
                disabled={!connected}
                onClick={handleDisconnect}
              >
                Disconnect</Button>
            </div>
          </div>

          <div className="flex-1"></div>
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <Avatar className="w-6 h-6 bg-gray-200">
                <AvatarImage src="avatar/01.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" alignOffset={-5}>
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Change Endpoint</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="shrink-0 bg-border h-[1px] w-full"></div>
      </div>
      <ScrollArea ref={scrollRef} className="flex-1 overflow-x-hidden">
        <div className="flex flex-col gap-1 p-2 max-w-3xl mx-auto">
          {conversation.map((msg, i) => {
            return (
              <div key={i} className="flex gap-2 first:mt-2">
                {msg.type === "bot" && (
                  <>
                    {conversation[i - 1] &&
                      conversation[i - 1].type === "bot" ? (
                      <div className={`w-6 h-6`}></div>
                    ) : (
                      <Avatar className={`w-6 h-6 bg-gray-200`}>
                        <AvatarImage src="avatar/02.png" />
                        <AvatarFallback>.ˍ.</AvatarFallback>
                      </Avatar>
                    )}
                  </>
                )}
                {(msg.type === "bot" || msg.type === "user") &&
                  <div
                    className={`max-w-[60%] flex flex-col ${msg.type === "bot"
                      ? "bg-white mr-auto"
                      : "text-white bg-black ml-auto"
                      } items-start gap-2 rounded-lg border p-2 text-left text-sm transition-all whitespace-pre-wrap`}
                  >
                    {msg.message}
                  </div>}
                {msg.type === "status" &&
                  <div className=" p-1.5 text-xs text-center flex flex-col max-w-[60%] mx-auto">
                    {msg.message}
                  </div>
                }
                {msg.type === "user" && (
                  <>
                    {conversation[i - 1] &&
                      conversation[i - 1].type === "user" ? (
                      <div className={`w-6 h-6`}></div>
                    ) : (
                      <Avatar className={`w-6 h-6 bg-gray-200`}>
                        <AvatarImage src="avatar/01.png" />
                        <AvatarFallback>.ˍ.</AvatarFallback>
                      </Avatar>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
        <div ref={messagesEndRef} className="mb-2"></div>
      </ScrollArea>
      <div className="w-full sm:max-w-3xl mx-auto">
        <div className="bg-white sm:rounded-t-md border-t sm:border shadow-lg">
          <div className="p-4">
            <div className="flex flex-row gap-3 p-4 border rounded-t-md">
              {/* <div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="outline-none">
                    <div className="h-8 w-8 p-0 rounded-full shadow-sm border flex items-center justify-center">
                      <PlusIcon className="h-4 w-4" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" alignOffset={-10}>
                    <DropdownMenuLabel>More options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Reset</DropdownMenuItem>
                    <DropdownMenuItem>
                      Attach <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div> */}
              <AutosizeTextarea
                className="flex-1 outline-none border-0"
                placeholder="Type here ..."
                minHeight={25}
                maxHeight={55}
                rows={1}
                onKeyDown={(e) => handleEnter(e)}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={!connected}
              />
              <Button
                onClick={() => sendMessage()}
                className={clsx("h-8 w-8 p-0 cursor")}
                disabled={!connected}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 256 256"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M200 32v144a8 8 0 0 1-8 8H67.31l34.35 34.34a8 8 0 0 1-11.32 11.32l-48-48a8 8 0 0 1 0-11.32l48-48a8 8 0 0 1 11.32 11.32L67.31 168H184V32a8 8 0 0 1 16 0Z"></path>
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}