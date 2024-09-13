'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SendIcon, Loader2, Plus, MessageSquare, Eye, Code } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Sandbox } from '@e2b/sdk'

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function UiGenerator() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: "Hello! How can I help you generate a UI design today?", sender: 'ai' },
  ])
  const [input, setInput] = useState('')
  const [isGeneratingUI, setIsGeneratingUI] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [editableCode, setEditableCode] = useState('')
  const [showDesign, setShowDesign] = useState(false)
  const [compileTrigger, setCompileTrigger] = useState(0)
  const [compiledCode, setCompiledCode] = useState<React.ReactNode | null>(null)
  const [sandbox, setSandbox] = useState<Sandbox | null>(null)

  useEffect(() => {
    async function initializeSandbox() {
      try {
        const apiKey = process.env.NEXT_PUBLIC_E2B_API_KEY;
        if (!apiKey) {
          throw new Error('E2B API key is not set in environment variables');
        }
        
        const newSandbox = await Sandbox.create({ 
          apiKey,
          template: 'base'
        });
        setSandbox(newSandbox);
      } catch (error) {
        console.error('Error initializing sandbox:', error);
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          text: `Error initializing sandbox: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your E2B API key.`, 
          sender: 'ai' 
        }]);
      }
    }
    initializeSandbox();
    return () => {
      if (sandbox) {
        sandbox.close()
      }
    }
  }, [])

  useEffect(() => {
    if (generatedCode) {
      setEditableCode(generatedCode)
    }
  }, [generatedCode])

  const handleSend = () => {
    if (input.trim()) {
      const newUserMessage: Message = { id: Date.now().toString(), text: input, sender: 'user' }
      setMessages(prev => [...prev, newUserMessage])
      setInput('')
      
      // Simulate AI response
      setTimeout(() => {
        const aiReply: Message = {
          id: (Date.now() + 1).toString(),
          text: `I understand you want to create a UI for "${input}". Let's generate the UI design based on your description.`,
          sender: 'ai'
        }
        setMessages(prev => [...prev, aiReply])
      }, 1000)
    }
  }

  const handleGenerateUI = async () => {
    if (!input.trim()) {
      setMessages(prev => [...prev, { id: Date.now().toString(), text: `Please enter a question or description for the UI.`, sender: 'ai' }]);
      return;
    }

    setIsGeneratingUI(true);
    setMessages(prev => [...prev, { id: Date.now().toString(), text: `Generating UI design...`, sender: 'ai' }]);
    
    try {
      const response = await fetch(`${BACKEND_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: input,
          code_sample: `
            import React from 'react';
            import { Input, Button, Card, Typography } from '@nlmk/ds-2.0';

            const Interface = () => {
              return (
                <div>
                  {/* Generated UI components will go here */}
                </div>
              );
            };
            
            export default Interface;
          `
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (typeof data.result === 'string') {
        // Extract code from the result
        const codeMatch = data.result.match(/```typescript\n([\s\S]*?)```/);
        if (codeMatch && codeMatch[1]) {
          const extractedCode = codeMatch[1].trim();
          setGeneratedCode(extractedCode);
          setEditableCode(extractedCode);
          setShowDesign(true);
        }

        // Extract explanation text
        const explanation = data.result.replace(/```typescript\n[\s\S]*?```/, '').trim();
        setMessages(prev => [...prev, { id: Date.now().toString(), text: explanation || 'UI design has been generated successfully!', sender: 'ai' }]);
      } else {
        throw new Error('Unexpected response format from server');
      }
    } catch (error) {
      console.error('Error generating UI:', error);
      setMessages(prev => [...prev, { id: Date.now().toString(), text: `Error generating UI: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again with a different description.`, sender: 'ai' }]);
    } finally {
      setIsGeneratingUI(false);
    }
  };

  const handleCreateNewDesign = () => {
    setMessages([{ id: Date.now().toString(), text: "Hello! How can I help you generate a UI design today?", sender: 'ai' }])
    setGeneratedCode('')
    setEditableCode('')
    setShowDesign(false)
  }

  const handleOpenDesignHistory = () => {
    alert('Design history feature is not implemented in this demo.')
  }

  const handleCodeChange = (newCode: string) => {
    setEditableCode(newCode)
  }

  const compileCode = async () => {
    if (!sandbox) {
      setCompiledCode(<div>Sandbox is not initialized. Please try again.</div>)
      return
    }

    try {
      setCompiledCode(<div>Compiling code...</div>)
      
      // Install necessary packages
      const installProcess = await sandbox.process.start({
        cmd: 'npm install react react-dom @nlmk/ds-2.0'
      });
      await installProcess.wait();

      // Create a temporary file with the code
      await sandbox.filesystem.write('/app/component.js', `
        const React = require('react');
        const ReactDOMServer = require('react-dom/server');
        const DS = require('@nlmk/ds-2.0');

        ${editableCode}

        console.log(ReactDOMServer.renderToString(React.createElement(Interface)));
      `);

      // Execute the code
      const execProcess = await sandbox.process.start({
        cmd: 'node /app/component.js'
      });
      await execProcess.wait();

      if (execProcess.exit_code !== 0) {
        setCompiledCode(<div>Error: {execProcess.output.stderr}</div>)
      } else {
        // The output will be a string of HTML
        setCompiledCode(<div dangerouslySetInnerHTML={{ __html: execProcess.output.stdout }} />)
      }
    } catch (error) {
      console.error('Error compiling code:', error)
      setCompiledCode(<div>Error compiling code: {error instanceof Error ? error.message : 'Unknown error'}</div>)
    }
  }

  const renderAst = (node: any): React.ReactNode => {
    if (typeof node !== 'object' || node === null) {
      return String(node)
    }
    if (Array.isArray(node)) {
      return node.map((child, index) => <React.Fragment key={index}>{renderAst(child)}</React.Fragment>)
    }
    switch (node.type) {
      case 'Module':
        return node.body.map((child: any, index: number) => <React.Fragment key={index}>{renderAst(child)}</React.Fragment>)
      case 'FunctionDef':
      case 'ClassDef':
        return <div key={node.name}>{node.name}: {node.body.map((child: any, index: number) => <React.Fragment key={index}>{renderAst(child)}</React.Fragment>)}</div>
      case 'Return':
        return <div>return {renderAst(node.value)}</div>
      case 'Call':
        return <div>{renderAst(node.func)}({node.args.map((arg: any, index: number) => <React.Fragment key={index}>{renderAst(arg)}</React.Fragment>)})</div>
      case 'Name':
        return <span>{node.id}</span>
      case 'Str':
        return <span>"{node.s}"</span>
      default:
        return <span>{JSON.stringify(node)}</span>
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className={`flex flex-col ${showDesign ? 'w-1/2' : 'w-full'} p-4 transition-all duration-300`}>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">AI UI Generator</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCreateNewDesign}>
              <Plus className="h-4 w-4 mr-2" />
              New Design
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenDesignHistory}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Design History
            </Button>
          </div>
        </div>
        <Card className="flex-grow mb-4 shadow-lg">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <CardContent>
              {messages.map((message) => (
                <div key={message.id} className={`mb-4 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block p-3 rounded-lg ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </ScrollArea>
        </Card>
        <div className="flex gap-2">
          <Input 
            placeholder="Describe your UI..." 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-grow"
          />
          <Button onClick={handleSend}>
            <SendIcon className="h-4 w-4" />
          </Button>
          <Button onClick={handleGenerateUI} disabled={isGeneratingUI}>
            {isGeneratingUI ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate UI'
            )}
          </Button>
        </div>
      </div>
      {showDesign && (
        <div className="w-1/2 h-screen overflow-auto bg-white border-l p-4">
          <Tabs defaultValue="code">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="code">
                <Code className="h-4 w-4 mr-2" />
                Code
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
            </TabsList>
            <TabsContent value="code">
              <Textarea
                value={editableCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="w-full h-[calc(100vh-200px)] font-mono text-sm"
              />
              <Button onClick={compileCode} className="mt-4">
                Compile and Preview
              </Button>
            </TabsContent>
            <TabsContent value="preview">
              <div className="border rounded-lg p-4 h-[calc(100vh-200px)] overflow-auto">
                {compiledCode}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}