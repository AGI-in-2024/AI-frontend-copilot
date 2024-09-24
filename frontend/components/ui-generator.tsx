'use client'

import React, { useState, useEffect, useRef, useCallback, createElement } from 'react'
import { Button } from '@nlmk/ds-2.0'
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SendIcon, ImageIcon, Maximize2, Download, Copy, Minimize2, Check, Settings } from 'lucide-react'
import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-tsx'
import 'prismjs/themes/prism-tomorrow.css'
import axios from 'axios';
import { Textarea } from "@/components/ui/textarea";
import * as NLMKDS from '@nlmk/ds-2.0'
import { PageEditor } from "./PageEditor";
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Sandpack } from "@codesandbox/sandpack-react";
import { getParameters } from 'codesandbox/lib/api/define';

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
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isGeneratingUI, setIsGeneratingUI] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [editableCode, setEditableCode] = useState('')
  const [showDesign, setShowDesign] = useState(false)
  const [versions, setVersions] = useState<Version[]>([])
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [previewType, setPreviewType] = useState<'iframe' | 'codesandbox'>('codesandbox')
  const [currentVersion, setCurrentVersion] = useState(1)
  const [isCopied, setIsCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sandboxUrl, setSandboxUrl] = useState('');
  const sandboxIframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setMessages([{ id: '1', text: "Здравствуйте! Как я могу помочь вам сгенеировать дизайн интерфейса сегодня?", sender: 'ai' }])
  }, [])

  useEffect(() => {
    // Create initial sandbox URL when component mounts
    const initialSandboxUrl = getCodeSandboxUrl('// Initial code');
    setSandboxUrl(initialSandboxUrl);
  }, []);

  useEffect(() => {
    if (generatedCode) {
      const newVersion = {
        id: (versions.length + 1).toString(),
        code: generatedCode
      };
      setVersions(prev => [...prev, newVersion]);
      setSelectedVersion(newVersion.id);
      setCurrentVersion(versions.length + 1);
      setEditableCode(generatedCode);
      updateIndexFile(generatedCode);
    }
  }, [generatedCode])

  const updateIndexFile = useCallback(async (code: string) => {
    try {
      await axios.post(`${API_URL}/update-preview`, { code }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('index.tsx updated successfully');
    } catch (error) {
      console.error('Error updating index.tsx:', error);
    }
  }, []);

  const handleSendAndGenerate = async () => {
    if (!input.trim()) {
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "Пожалуйста, введите вопрос или описание для интерфейса.", sender: 'ai' }]);
      return;
    }

    const newUserMessage: Message = { id: Date.now().toString(), text: input, sender: 'user' }
    setMessages(prev => [...prev, newUserMessage])
    setInput('')

    setIsGeneratingUI(true);
    setMessages(prev => [...prev, { id: Date.now().toString(), text: "Генерция изайна интефейса...", sender: 'ai' }]);
    
    if (isAdminMode) {
      setTimeout(() => {
        const testerModeCode = `
import React, { useState } from 'react';
import { Sidebar, Header, Tabs, Grid, Checkbox, Input, Button } from '@nlmk/ds-2.0';

const Interface = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [checkboxes, setCheckboxes] = useState({ checkbox1: false, checkbox2: false });
  const [inputValues, setInputValues] = useState({ input1: '', input2: '' });

  const handleCheckboxChange = (id) => {
    setCheckboxes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleInputChange = (id, value) => {
    setInputValues(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    console.log('Submitted:', { checkboxes, inputValues });
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar 
        orientation="vertical" 
        allowFavorites={false} 
        isLoggedIn={false} 
        onOpenUser={() => {}} 
        currentPath="/" 
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header title="Заголоок страницы" bg={true} />
        <Tabs style={{ padding: '0 var(--16-size)' }}>
          <Tabs.Tab 
            label="Вкладка 1" 
            active={activeTab === 0} 
          />
          <Tabs.Tab 
            label="Вкладка 2" 
            active={activeTab === 1} 
          />
        </Tabs>
        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--24-size)' }}>
          <Grid gap="var(--32-size)">
            <Grid.Column style={{ flex: 1 }}>
              <h3 style={{ marginBottom: 'var(--16-size)' }}>Список чекбоксов</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--12-size)' }}>
                <Checkbox 
                  label="Чекбокс 1" 
                  id="checkbox1" 
                  checked={checkboxes.checkbox1}
                  onChange={() => handleCheckboxChange('checkbox1')} 
                />
                <Checkbox 
                  label="Чекбокс 2" 
                  id="checkbox2" 
                  checked={checkboxes.checkbox2}
                  onChange={() => handleCheckboxChange('checkbox2')} 
                />
              </div>
            </Grid.Column>
            <Grid.Column style={{ flex: 1 }}>
              <h3 style={{ marginBottom: 'var(--16-size)' }}>Форма</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--16-size)' }}>
                <Input 
                  label="Поле 1" 
                  id="input1" 
                  value={inputValues.input1}
                  onChange={(e) => handleInputChange('input1', e.target.value)} 
                />
                <Input 
                  label="Поле 2" 
                  id="input2" 
                  value={inputValues.input2}
                  onChange={(e) => handleInputChange('input2', e.target.value)} 
                />
                <Button onClick={handleSubmit} style={{ alignSelf: 'flex-start', marginTop: 'var(--8-size)' }}>Отправить</Button>
              </div>
            </Grid.Column>
          </Grid>
        </div>
      </div>
    </div>
  );
};

export default Interface;
        `;
        setGeneratedCode(testerModeCode);
        setEditableCode(testerModeCode);
        updateSandboxPreview(testerModeCode);
        setShowDesign(true);
        setMessages(prev => [...prev, { id: Date.now().toString(), text: "Дизайн интерфейса успешно сгенерирован в режим администратора!", sender: 'ai' }]);
        setIsGeneratingUI(false);
      }, 1000);
    } else {
      try {
        console.log('Sending request to backend...');
        const response = await axios.post(`${API_URL}/generate`, { question: input }, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('Received response from backend:', response.data);
        const generatedCode = response.data.result;
        console.log('Generated code:', generatedCode);

        if (typeof generatedCode === 'string' && generatedCode.startsWith('An error occurred')) {
          throw new Error(generatedCode);
        }

        setGeneratedCode(generatedCode);
        setEditableCode(generatedCode);

        await updateIndexFile(generatedCode);

        const sandboxUrl = getCodeSandboxUrl(generatedCode);
        setSandboxUrl(sandboxUrl);

        setShowDesign(true);
        setMessages(prev => [...prev, { id: Date.now().toString(), text: "Дизайн интерфейса успешно сгенерирован!", sender: 'ai' }]);
      } catch (error: unknown) {
        console.error('Error generating UI:', error);
        if (axios.isAxiosError(error)) {
          console.error('Axios error details:', error.response?.data);
        }
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        setMessages(prev => [...prev, { id: Date.now().toString(), text: `Произошла ошибка при генерации интерфейса: ${errorMessage}`, sender: 'ai' }]);
      } finally {
        setIsGeneratingUI(false);
      }
    }
  };

  const updateSandboxPreview = useCallback((code: string) => {
    setGeneratedCode(code);
    if (sandboxIframeRef.current && sandboxIframeRef.current.contentWindow) {
      sandboxIframeRef.current.contentWindow.postMessage({ type: 'update', code }, '*');
    }
  }, []);

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

  const handleCodeChange = useCallback((code: string) => {
    setEditableCode(code);
    updateIndexFile(code);
    updateSandboxPreview(code);
  }, [updateIndexFile, updateSandboxPreview]);

  const renderComponent = (Component: any): React.ReactNode => {
    if (typeof Component === 'function') {
      try {
        return <Component />;
      } catch (error) {
        console.error('Error rendering component:', error);
        return <div className="text-red-500">Error rendering component: {error instanceof Error ? error.message : 'Unknown error'}</div>;
      }
    }
    return Component;
  };

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
              text: "Избражение вставлено",
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
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    }, (err) => {
      console.error('Не удалось скопировать текст: ', err);
    });
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  }

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
        'App.js': {
          content: code,
          isBinary: false
        },
        'styles.css': {
          content: `
@import url('https://nlmk-group.github.io/ds-2.0//css/main.css');
@import url('https://fonts.cdnfonts.com/css/pt-root-ui');

html, body {
  background-color: var(--steel-10);
}

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

* {
  font-family: 'PT Root UI', sans-serif !important;
}
          `,
          isBinary: false
        },
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

    return `https://codesandbox.io/api/v1/sandboxes/define?parameters=${parameters}&query=view=preview&runonclick=1&embed=1`;
  }, []);

  return (
    <div className="flex h-screen bg-[#EDEEEF]">
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
            >
              Новый чат
            </Button>
            <Button 
              variant="secondary"
              size="m"
              onClick={handleOpenDesignHistory}
            >
              История чата
            </Button>
          </div>
        </div>
        <Card className="flex-grow mb-0 shadow-lg border-[#2864CE] bg-white rounded-b-none">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <CardContent>
              {messages.map((message) => (
                <div key={message.id} className={`mb-4 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block p-3 rounded-lg ${message.sender === 'user' ? 'bg-[#2864CE] text-white' : 'bg-[#EDEEEF] text-black'}`}>
                    {message.image ? (
                      <img src={message.image} alt="Загруженное изображение" className="max-w-full h-auto rounded" />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
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
              onClick={handleAddImage}
              iconButton={<ImageIcon className="h-4 w-4" />}
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
      {showDesign && (
        <div className={`${isFullscreen ? 'w-full' : 'w-1/2'} h-screen overflow-auto bg-[#EDEEEF] border-l border-[#2864CE] p-4 transition-all duration-300`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#0053A0]">Preview and Code</h2>
            <Button 
              variant="secondary"
              fill="outline"
              size="m"
              onClick={toggleFullscreen} 
              className="border-[#2864CE] text-[#1952B6] hover:bg-[#E6F0F9]"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>

          <div className="space-y-4">
            {/* Preview Section */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold text-[#0053A0] mb-2">Preview</h3>
              <div className="w-full h-[600px]">
                <iframe
                  ref={sandboxIframeRef}
                  src={sandboxUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 0,
                    borderRadius: '4px',
                    overflow: 'hidden',
                    background: 'white',
                  }}
                  title="CodeSandbox Preview"
                  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
                  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
                />
              </div>
            </div>

            {/* Code Section */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-[#0053A0]">Code</h3>
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
                  Current: V{currentVersion}
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
                    height: 'calc(100vh - 600px)', // Adjusted height
                    overflow: 'auto',
                    backgroundColor: '#EDEEEF',
                    color: '#000',
                  }}
                  textareaClassName="focus:outline-none"
                  className="min-h-[300px] focus-within:shadow-outline-blue"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button 
                    variant="secondary"
                    fill="outline"
                    size="m"
                    onClick={handleDownloadCode} 
                    className="bg-white text-[#0053A0] hover:bg-[#E6F0F9] border-[#0053A0]"
                    iconButton={<Download className="h-4 w-4" />}
                  />
                  <Button 
                    variant="secondary"
                    fill="outline"
                    size="m"
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