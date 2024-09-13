'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SendIcon, Loader2, Plus, MessageSquare, Eye, Code } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import dynamic from 'next/dynamic'

// Updated mock implementation
const mockDS2 = `
const React = {
  createElement: (type, props, ...children) => ({type, props, children}),
  Fragment: 'Fragment'
};

const Typography = ({variant, color, children}) => 
  React.createElement('div', {style: {fontWeight: variant.includes('Bold') ? 'bold' : 'normal'}}, children);

const ds2 = {
  Typography
};

// Mock any other components you need here
`;

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export function UiGenerator() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: "Hello! How can I help you generate a UI design today?", sender: 'ai' },
  ])
  const [input, setInput] = useState('')
  const [isGeneratingUI, setIsGeneratingUI] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [editableCode, setEditableCode] = useState('')
  const [compiledCode, setCompiledCode] = useState<React.ReactNode | null>(null)
  const [showDesign, setShowDesign] = useState(false)

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
          question: input
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (typeof data.result === 'string') {
        // Extract code from the result
        const codeMatch = data.result.match(/```tsx\n([\s\S]*?)```/);
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
      setMessages(prev => [...prev, { id: Date.now().toString(), text: `Error generating UI: ${error instanceof Error ? error.message : 'Unknown error'}`, sender: 'ai' }]);
    } finally {
      setIsGeneratingUI(false);
    }
  };

  const handleCreateNewDesign = () => {
    setMessages([{ id: Date.now().toString(), text: "Hello! How can I help you generate a UI design today?", sender: 'ai' }])
    setGeneratedCode('')
    setEditableCode('')
    setCompiledCode(null)
    setShowDesign(false)
  }

  const handleOpenDesignHistory = () => {
    alert('Design history feature is not implemented in this demo.')
  }

  const handleCodeChange = (newCode: string) => {
    setEditableCode(newCode)
  }

  const compileCode = () => {
    setCompiledCode(<SafeRender code={editableCode} />)
  }

  // Update the SafeRender component
  const SafeRender = ({ code }: { code: string }) => {
    const [error, setError] = useState<Error | null>(null);
    const [renderedOutput, setRenderedOutput] = useState<string | null>(null);

    useEffect(() => {
      try {
        // Wrap the code in a function to avoid top-level return issues
        const wrappedCode = `
          ${mockDS2}
          function render() {
            ${code}
            return Interface();
          }
          return JSON.stringify(render());
        `;
        
        // Use Function constructor instead of AsyncFunction
        const renderFunc = new Function(wrappedCode);
        const result = renderFunc();
        setRenderedOutput(result);
        setError(null);
      } catch (err) {
        console.error('Error in SafeRender:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setRenderedOutput(null);
      }
    }, [code]);

    if (error) {
      return <div className="text-red-500">Error: {error.message}</div>;
    }

    if (!renderedOutput) {
      return <div>Loading...</div>;
    }

    // Parse the stringified output and render it
    const renderComponent = (node: any): React.ReactNode => {
      if (typeof node !== 'object' || node === null) {
        return String(node);
      }
      if (Array.isArray(node)) {
        return node.map((child, index) => <React.Fragment key={index}>{renderComponent(child)}</React.Fragment>);
      }
      const { type, props, children } = node;
      return React.createElement(
        type,
        { ...props, key: props.key },
        children ? children.map((child: any, index: number) => <React.Fragment key={index}>{renderComponent(child)}</React.Fragment>) : null
      );
    };

    try {
      const parsedOutput = JSON.parse(renderedOutput);
      return <div>{renderComponent(parsedOutput)}</div>;
    } catch (parseError) {
      return <div className="text-red-500">Error parsing output: {String(parseError)}</div>;
    }
  };

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
          {!isGeneratingUI && (
            <Button onClick={handleGenerateUI}>Generate UI</Button>
          )}
          {isGeneratingUI && (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </Button>
          )}
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