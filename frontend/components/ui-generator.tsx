'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@nlmk/ds-2.0'
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SendIcon, ImageIcon, Maximize2, Download, Copy, Minimize2, Check, Settings, MessageSquare, Wand2, Code, Clock, RefreshCw, Edit } from 'lucide-react'
import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-tsx'
import 'prismjs/themes/prism-tomorrow.css'
import axios from 'axios';
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import dynamic from 'next/dynamic';
import { getParameters } from 'codesandbox/lib/api/define';
import { SandpackClient } from '@codesandbox/sandpack-client';

// Dynamically import Sandpack with ssr disabled
const DynamicSandpack = dynamic(
  () => import('@codesandbox/sandpack-react').then((mod) => mod.Sandpack),
  { ssr: false }
);

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  image?: string
}

interface Version {
  id: string
  code: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const UiGenerator = () => {
  // State declarations
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [editableCode, setEditableCode] = useState('')
  const [showDesign, setShowDesign] = useState(false)
  const [versions, setVersions] = useState<Version[]>([])
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [currentVersion, setCurrentVersion] = useState(1)
  const [isCopied, setIsCopied] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [sandboxUrl, setSandboxUrl] = useState('')
  const [sandpackClient, setSandpackClient] = useState<SandpackClient | null>(null)
  const [codeDescription, setCodeDescription] = useState('')
  const [isCodeGenerated, setIsCodeGenerated] = useState(false)
  const [descriptionMessageId, setDescriptionMessageId] = useState<string | null>(null)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sandboxIframeRef = useRef<HTMLIFrameElement>(null)

  // Loading states
  const [isGeneratingUI, setIsGeneratingUI] = useState(false)
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [isImproving, setIsImproving] = useState(false)
  const [isRegeneratingCode, setIsRegeneratingCode] = useState(false)

  // Constants
  const commonStyles = `
    @import url('https://nlmk-group.github.io/ds-2.0//css/main.css');
    @import url('https://fonts.cdnfonts.com/css/pt-root-ui');

    html, body { background-color: var(--steel-10); }

    #root {
      -webkit-font-smoothing: auto;
      -moz-font-smoothing: auto;
      -moz-osx-font-smoothing: grayscale;
      font-smoothing: auto;
      text-rendering: optimizeLegibility;
      font-smooth: always;
      -webkit-tap-highlight-color: transparent;
      -webkit-touch-callout: none;
      margin: 20px;
      display: flex;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }

    * { font-family: 'PT Root UI', sans-serif !important; }
  `;

  // Effects
  useEffect(() => {
    setMessages([{ 
      id: '1', 
      text: "Добро пожаловать в ИИ Генератор Интерфейса! Здесь вы можете создавать дизайн интерфейса с помощью искусственного интеллекта. Просто опишите желаемый интерфейс, и я помогу вам его сгенерировать. Используйте кнопки внизу для отправки сообщения, генерации описания или быстрого улучшения кода.", 
      sender: 'ai' 
    }]);

    createSandbox('// Initial code');
  }, []);

  useEffect(() => {
    if (generatedCode) {
      const newVersion = { id: (versions.length + 1).toString(), code: generatedCode };
      setVersions(prev => [...prev, newVersion]);
      setSelectedVersion(newVersion.id);
      setCurrentVersion(versions.length + 1);
      setEditableCode(generatedCode);
      updateIndexFile(generatedCode);
    }
  }, [generatedCode]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Callbacks
  const updateIndexFile = useCallback(async (code: string) => {
    try {
      await axios.post(`${API_URL}/update-preview`, { code }, {
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('index.tsx updated successfully');
    } catch (error) {
      console.error('Error updating index.tsx:', error);
    }
  }, []);

  const updateSandboxPreview = useCallback((code: string) => {
    if (sandpackClient) {
      sandpackClient.updateFile('/App.js', code);
    }
  }, [sandpackClient]);

  const handleCodeChange = useCallback((code: string) => {
    setEditableCode(code);
    updateIndexFile(code);
    updateSandboxPreview(code);
  }, [updateIndexFile, updateSandboxPreview]);

  // Helper functions
  const createSandbox = (code: string) => {
    const parameters = getParameters({
      files: {
        'index.js': {
          content: `
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
          `,
          isBinary: false
        },
        'App.js': { content: code, isBinary: false },
        'styles.css': { content: commonStyles, isBinary: false },
        'public/index.html': {
          content: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>
          `,
          isBinary: false
        },
        'package.json': {
          content: JSON.stringify({
            dependencies: {
              react: "^18.0.0",
              "react-dom": "^18.0.0",
              "react-scripts": "^5.0.0",
              "@nlmk/ds-2.0": "2.5.3"
            },
            main: "/index.js",
            devDependencies: {}
          }),
          isBinary: false
        }
      }
    });

    setSandboxUrl(`https://codesandbox.io/api/v1/sandboxes/define?parameters=${parameters}&query=view=preview&runonclick=1&embed=1`);
  };

  const getCodeSandboxUrl = useCallback((code: string) => {
    const parameters = getParameters({
      files: {
        'index.js': {
          content: `
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
          `,
          isBinary: false
        },
        'App.js': { content: code, isBinary: false },
        'styles.css': { content: commonStyles, isBinary: false },
        'public/index.html': {
          content: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</html>
          `,
          isBinary: false
        }
      }
    });

    return `https://codesandbox.io/api/v1/sandboxes/define?parameters=${parameters}&query=view=preview&runonclick=1&embed=1`;
  }, []);

  // Event handlers
  const handleSendAndGenerate = async () => {
    if (!input.trim()) {
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "Пожалуйста, введите вопрос или описание для интерфейса.", sender: 'ai' }]);
      return;
    }

    const newUserMessage: Message = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, newUserMessage]);
    setInput('');

    setIsGeneratingUI(true);
    setMessages(prev => [...prev, { id: Date.now().toString(), text: "Генерация дизайна интерфейса...", sender: 'ai' }]);
    
    if (isAdminMode) {
      setTimeout(() => {
        const testerModeCode = `test`;
        setGeneratedCode(testerModeCode);
        setEditableCode(testerModeCode);
        updateSandboxPreview(testerModeCode);
        setShowDesign(true);
        setMessages(prev => [...prev, { id: Date.now().toString(), text: "Дизайн интерфейса успешно сгенерирован в режиме администратора!", sender: 'ai' }]);
        setIsGeneratingUI(false);
      }, 1000);
    } else {
      try {
        const response = await axios.post(`${API_URL}/generate`, { question: input }, {
          headers: { 'Content-Type': 'application/json' },
        });
        const generatedCode = response.data.result;

        if (typeof generatedCode === 'string' && generatedCode.startsWith('An error occurred')) {
          throw new Error(generatedCode);
        }

        setGeneratedCode(generatedCode);
        setEditableCode(generatedCode);
        setCodeDescription(input);
        setIsCodeGenerated(true);

        await updateIndexFile(generatedCode);

        const sandboxUrl = getCodeSandboxUrl(generatedCode);
        setSandboxUrl(sandboxUrl);

        setShowDesign(true);
        setMessages(prev => [...prev, { id: Date.now().toString(), text: "Дизайн интерфейса успешно сгенерирован!", sender: 'ai' }]);
      } catch (error: unknown) {
        console.error('Error generating UI:', error);
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        setMessages(prev => [...prev, { id: Date.now().toString(), text: `Произошла ошибка при генерации интерфейса: ${errorMessage}`, sender: 'ai' }]);
      } finally {
        setIsGeneratingUI(false);
      }
    }
  };

  const handleCreateNewDesign = () => {
    setMessages([{ id: Date.now().toString(), text: "Здравствуйте! Как  могу помочь вам сгенерировть дизайн интерфейса сегодня?", sender: 'ai' }])
    setGeneratedCode('')
    setEditableCode('')
    setShowDesign(false)
    setVersions([])
    setSelectedVersion(null)
  }

  const handleOpenDesignHistory = () => {
    alert('Функция итории дизайнов не реализована в этой демо-версии.')
  }

  const handleAddImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const newMessage: Message = {
          id: Date.now().toString(),
          text: "Изображение заружено",
          sender: 'user',
          image: e.target?.result as string
        }
        setMessages(prev => [...prev, newMessage])
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePaste = (event: React.ClipboardEvent) => {
    const items = event.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile()
        if (blob) {
          const reader = new FileReader()
          reader.onload = (e) => {
            const newMessage: Message = {
              id: Date.now().toString(),
              text: "Избржеие вставлено",
              sender: 'user',
              image: e.target?.result as string
            }
            setMessages(prev => [...prev, newMessage])
          }
          reader.readAsDataURL(blob)
        }
      }
    }
  }

  const handleDownloadCode = () => {
    const element = document.createElement("a");
    const file = new Blob([editableCode], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "generated-component.tsx";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(editableCode).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }, (err) => {
      console.error('Не удалось скопировать текст: ', err);
      // Display error to user
      alert(`Failed to copy: ${err.message}`);
    });
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  }

  const handleGenerateDescription = async () => {
    if (!input.trim()) {
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "Пожалуйста, введите описание для интерфейса.", sender: 'ai' }]);
      return;
    }

    setIsGeneratingDescription(true);
    setMessages(prev => [...prev, { id: Date.now().toString(), text: "Генерация описания интерфейса...", sender: 'ai' }]);

    try {
      const response = await axios.post(`${API_URL}/generate-description`, { question: input }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const generatedDescription = response.data.result;

      const newMessageId = Date.now().toString();
      setMessages(prev => [...prev, { id: newMessageId, text: generatedDescription, sender: 'ai' }]);
      setDescriptionMessageId(newMessageId);
    } catch (error) {
      console.error('Error generating description:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setMessages(prev => [...prev, { id: Date.now().toString(), text: `Произошла ошибка при генерации описания: ${errorMessage}`, sender: 'ai' }]);
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleGenerateCodeFromDescription = (description: string) => {
    setIsGeneratingUI(true);
    setMessages(prev => [...prev, { id: Date.now().toString(), text: "Генерация дизайна интерфейса...", sender: 'ai' }]);
    
    axios.post(`${API_URL}/generate`, { question: description }, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then(response => {
      const generatedCode = response.data.result;
      setGeneratedCode(generatedCode);
      setEditableCode(generatedCode);
      setCodeDescription(description);
      setIsCodeGenerated(true);
      updateIndexFile(generatedCode);
      const sandboxUrl = getCodeSandboxUrl(generatedCode);
      setSandboxUrl(sandboxUrl);
      setShowDesign(true);
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "Дизайн интерфейса успешно сгенерирован!", sender: 'ai' }]);
    })
    .catch(error => {
      console.error('Error generating UI:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setMessages(prev => [...prev, { id: Date.now().toString(), text: `Произошла ошибка при генерации интерфейса: ${errorMessage}`, sender: 'ai' }]);
    })
    .finally(() => {
      setIsGeneratingUI(false);
    });
  };

  const handleQuickImprove = async () => {
    if (!isCodeGenerated) {
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "Пожалуйста, сначала сгенерируйте код.", sender: 'ai' }]);
      return;
    }

    let improvementInput = input.trim();
    if (!improvementInput) {
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "Пожалуйста, предоставьте инструкции для улучшения.", sender: 'ai' }]);
      return;
    }

    setIsImproving(true);
    setMessages(prev => [...prev, { id: Date.now().toString(), text: "Улучшаю код...", sender: 'ai' }]);
    try {
      const response = await axios.post(`${API_URL}/quick-improve`, {
        code: editableCode,
        design: codeDescription,
        modification: improvementInput
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const improvedCode = response.data.result;
      setEditableCode(improvedCode);
      updateSandboxPreview(improvedCode);
      
      // Add versioning for quick edit
      const newVersion = { id: (versions.length + 1).toString(), code: improvedCode };
      setVersions(prev => [...prev, newVersion]);
      setSelectedVersion(newVersion.id);
      setCurrentVersion(versions.length + 1);

      setMessages(prev => [...prev, { id: Date.now().toString(), text: "Код успешно улучшен!", sender: 'ai' }]);
    } catch (error) {
      console.error('Ошибка при улучшении кода:', error);
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "Произошла ошибка при улучшении кода.", sender: 'ai' }]);
    } finally {
      setIsImproving(false);
    }
  };

  const handleCopyDescription = () => {
    navigator.clipboard.writeText(codeDescription).then(() => {
      // You can add a temporary state to show a "Copied!" message if you want
    }, (err) => {
      console.error('Failed to copy description: ', err);
    });
  };

  const handleDownloadDescription = () => {
    const element = document.createElement("a");
    const file = new Blob([codeDescription], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "code-description.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleRegenerateCode = async () => {
    setIsRegeneratingCode(true);
    try {
      const response = await axios.post(`${API_URL}/quick-improve`, {
        code: editableCode,
        design: codeDescription,
        modification: "Regenerate based on the current description"
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const regeneratedCode = response.data.result;
      setEditableCode(regeneratedCode);
      updateSandboxPreview(regeneratedCode);
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "Code has been regenerated based on the description!", sender: 'ai' }]);
    } catch (error) {
      console.error('Error regenerating code:', error);
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "An error occurred while regenerating the code.", sender: 'ai' }]);
    } finally {
      setIsRegeneratingCode(false);
    }
  };

  // Render
  return (
    <div className="flex h-screen bg-[#EDEEEF]">
      {/* Chat section */}
      <div className={`flex flex-col ${showDesign ? (isFullscreen ? 'w-0' : 'w-1/2') : 'w-full'} p-4 transition-all duration-300`}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <img src="logo_nlmk.svg" alt="NLMK Logo" className="h-12 mr-3" />
            <h1 className="text-2xl font-bold text-[#0053A0]">ИИ Генератор Интерфейса</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Button
                variant="secondary"
                size="m"
                onClick={() => setShowSettings(!showSettings)}
                iconButton={<Settings className="h-4 w-4" />}
              />
              {showSettings && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                  <div className="flex items-center space-x-2 p-2">
                    <Switch
                      id="admin-mode"
                      checked={isAdminMode}
                      onCheckedChange={setIsAdminMode}
                      className="data-[state=checked]:bg-[#2864CE]"
                    />
                    <Label htmlFor="admin-mode" className="text-[#1952B6] font-medium">Режим тестирования</Label>
                  </div>
                </div>
              )}
            </div>
            <Button 
              variant="primary"
              fill="solid"
              size="m"
              onClick={handleCreateNewDesign}
              className="bg-[#2864CE] text-white hover:bg-[#1952B6]"
              iconButton={<MessageSquare className="h-4 w-4" />}
            />
            <Button 
              variant="secondary"
              size="m"
              onClick={handleOpenDesignHistory}
              iconButton={<Clock className="h-4 w-4" />}
            />
          </div>
        </div>
        <Card className="flex-grow mb-0 shadow-lg border-[#2864CE] bg-white rounded-b-none">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <CardContent>
              {messages.map((message, index) => (
                <div key={message.id} className={`mb-4 ${index === 0 ? 'mt-4' : ''}`}>
                  <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`inline-block p-3 rounded-lg ${message.sender === 'user' ? 'bg-[#2864CE] text-white' : 'bg-[#EDEEEF] text-black'} max-w-[80%]`}>
                      {message.image ? (
                        <img src={message.image} alt="Загруженное изображение" className="max-w-full h-auto rounded" />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap text-left">{message.text}</p>
                      )}
                    </div>
                  </div>
                  <div className={`mt-2 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    <Button
                      variant="secondary"
                      fill="outline"
                      size="s"
                      onClick={() => navigator.clipboard.writeText(message.text)}
                      className="mr-2 border-[#2864CE] text-[#1952B6] hover:bg-[#E6F0F9]"
                      iconButton={<Copy className="h-4 w-4" />}
                    />
                    {message.id === descriptionMessageId && (
                      <Button
                        variant="secondary"
                        fill="solid"
                        size="s"
                        onClick={() => handleGenerateCodeFromDescription(message.text)}
                        className="bg-[#E6F0F9] text-[#2864CE] hover:bg-[#D1E4F5]"
                        iconButton={<Code className="h-4 w-4" />}
                      />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </ScrollArea>
        </Card>
        <div className="flex items-end gap-2 bg-white p-2 rounded-t-none rounded-b-lg">
          <Textarea 
            placeholder="Опишите ваш интерфейс..."
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendAndGenerate()}
            onPaste={handlePaste}
            className="flex-grow bg-white text-black min-h-[80px] border-[#2864CE] rounded-lg"
          />
          <div className="flex gap-2">
            <Button 
              variant="secondary"
              fill="solid"
              size="m"
              onClick={handleGenerateDescription}
              disabled={isGeneratingDescription}
              iconButton={<MessageSquare className="h-4 w-4" />}
              className="bg-[#E6F0F9] text-[#2864CE] hover:bg-[#D1E4F5]"
            />
            <Button 
              variant="secondary"
              fill="solid"
              size="m"
              onClick={handleQuickImprove}
              disabled={!isCodeGenerated || isImproving}
              iconButton={<Wand2 className="h-4 w-4" />}
              className="bg-[#E6F0F9] text-[#2864CE] hover:bg-[#D1E4F5]"
            />
            <Button 
              variant="primary"
              fill="solid"
              size="m"
              onClick={handleSendAndGenerate} 
              disabled={isGeneratingUI}
              iconButton={<SendIcon className="h-4 w-4" />}
              className="bg-[#2864CE] text-white hover:bg-[#1952B6]"
            />
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleImageUpload}
          accept="image/*"
        />
      </div>

      {/* Preview and code section */}
      {showDesign && (
        <div className={`${isFullscreen ? 'w-full' : 'w-1/2'} h-screen overflow-auto bg-[#EDEEEF] border-l border-[#2864CE] p-4 transition-all duration-300`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#0053A0]">Предпросмотр и код</h2>
            <Button 
              variant="secondary"
              fill="outline"
              size="m"
              onClick={toggleFullscreen} 
              className="border-[#2864CE] text-[#1952B6] hover:bg-[#E6F0F9]"
              iconButton={isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            />
          </div>

          <div className="space-y-4">
            {/* Preview Section */}
            <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-[#0053A0] mb-2">Предпросмотр</h3>
              <div className="w-full h-[calc(100vh-300px)]">
                {isMounted && (
                  <DynamicSandpack
                    template="react"
                    files={{
                      "/App.js": {
                        code: editableCode,
                      },
                      "/styles.css": {
                        code: commonStyles,
                      },
                    }}
                    options={{
                      showNavigator: false,
                      showTabs: false,
                      editorHeight: 600,
                      editorWidthPercentage: 60,
                    }}
                    customSetup={{
                      dependencies: {
                        "@nlmk/ds-2.0": "2.5.3"
                      }
                    }}
                    theme="light"
                  />
                )}
              </div>
            </div>

            {/* Description Section */}
            <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-[#0053A0]">Описание</h3>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    fill="outline"
                    size="s"
                    onClick={handleCopyDescription}
                    className="border-[#2864CE] text-[#1952B6] hover:bg-[#E6F0F9]"
                    iconButton={<Copy className="h-4 w-4" />}
                  />
                  <Button
                    variant="secondary"
                    fill="outline"
                    size="s"
                    onClick={handleDownloadDescription}
                    className="border-[#2864CE] text-[#1952B6] hover:bg-[#E6F0F9]"
                    iconButton={<Download className="h-4 w-4" />}
                  />
                  <Button
                    variant="primary"
                    fill="solid"
                    size="s"
                    onClick={handleRegenerateCode}
                    disabled={isRegeneratingCode}
                    className="bg-[#2864CE] text-white hover:bg-[#1952B6]"
                    iconButton={<RefreshCw className="h-4 w-4" />}
                  />
                </div>
              </div>
              {isEditingDescription ? (
                <Textarea
                  value={codeDescription}
                  onChange={(e) => setCodeDescription(e.target.value)}
                  className="w-full p-2 border border-[#2864CE] rounded"
                />
              ) : (
                <p className="text-sm whitespace-pre-wrap bg-[#F8F9FA] p-3 rounded-lg border border-[#E9ECEF] text-black">{codeDescription}</p>
              )}
              <Button
                variant="secondary"
                fill="outline"
                size="s"
                onClick={() => setIsEditingDescription(!isEditingDescription)}
                className="mt-2 border-[#2864CE] text-[#1952B6] hover:bg-[#E6F0F9]"
                iconButton={isEditingDescription ? <Check className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
              >
                {isEditingDescription ? '' : ''}
              </Button>
            </div>

            {/* Code Section */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="mb-4 flex justify-between items-center">c
                <h3 className="text-lg font-semibold text-[#0053A0]">Код</h3>
                <div className="flex space-x-2 overflow-x-auto">
                  {versions.map((version, index) => (
                    <Button
                      key={version.id}
                      variant={selectedVersion === version.id ? "primary" : "secondary"}
                      fill="solid"
                      size="s"
                      onClick={() => {
                        setSelectedVersion(version.id);
                        setEditableCode(version.code);
                        setCurrentVersion(index + 1);
                        updateIndexFile(version.code);
                      }}
                      className="flex-shrink-0"
                    >
                      V{index + 1}
                    </Button>
                  ))}
                </div>
                <div className="text-sm font-medium text-[#0053A0]">
                  Текущая: V{currentVersion}
                </div>
              </div>
              <div className="relative border-2 border-[#2864CE] rounded-lg overflow-hidden shadow-lg bg-white">
                <Editor
                  value={editableCode}
                  onValueChange={handleCodeChange}
                  highlight={(code) => highlight(code, languages.tsx, 'tsx')}
                  padding={20}
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 14,
                    lineHeight: 1.6,
                    height: 'calc(100vh - 600px)',
                    overflow: 'auto',
                    backgroundColor: '#F8F9FA',
                    color: '#000',
                  }}
                  textareaClassName="focus:outline-none"
                  className="min-h-[300px] focus-within:shadow-outline-blue"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button 
                    variant="secondary"
                    fill="outline"
                    size="s"
                    onClick={handleDownloadCode} 
                    className="bg-white text-[#0053A0] hover:bg-[#E6F0F9] border-[#0053A0]"
                    iconButton={<Download className="h-4 w-4" />}
                  />
                  <Button 
                    variant="secondary"
                    fill="outline"
                    size="s"
                    onClick={handleCopyCode} 
                    className="bg-white text-[#0053A0] hover:bg-[#E6F0F9] border-[#0053A0]"
                    iconButton={isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UiGenerator