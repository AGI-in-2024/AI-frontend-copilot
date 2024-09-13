'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SendIcon, Loader2, Plus, MessageSquare, Eye, Code, Image as ImageIcon, Maximize2, Download, Copy, Minimize2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-tsx'
import 'prismjs/themes/prism-tomorrow.css'
import axios from 'axios';
import { Textarea } from "@/components/ui/textarea";

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

const UiGenerator = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isGeneratingUI, setIsGeneratingUI] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [editableCode, setEditableCode] = useState('')
  const [compiledCode, setCompiledCode] = useState<React.ReactNode | null>(null)
  const [showDesign, setShowDesign] = useState(false)
  const [versions, setVersions] = useState<Version[]>([])
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMessages([{ id: '1', text: "Здравствуйте! Как я могу помочь вам сгенерировать дизайн интерфейса сегодня?", sender: 'ai' }])
  }, [])

  useEffect(() => {
    if (generatedCode) {
      setEditableCode(generatedCode)
      setVersions(prev => [...prev, { id: Date.now().toString(), code: generatedCode }])
      setSelectedVersion(Date.now().toString())
    }
  }, [generatedCode])

  const handleSendAndGenerate = async () => {
    if (!input.trim()) {
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "Пожалуйста, введите вопрос или описание для интерфейса.", sender: 'ai' }]);
      return;
    }

    const newUserMessage: Message = { id: Date.now().toString(), text: input, sender: 'user' }
    setMessages(prev => [...prev, newUserMessage])
    setInput('')

    setIsGeneratingUI(true);
    setMessages(prev => [...prev, { id: Date.now().toString(), text: "Генерация дизайна интерфейса...", sender: 'ai' }]);
    
    try {
      const response = await axios.post('http://localhost:5000/generate', { question: input });
      const generatedCode = response.data.result;

      setGeneratedCode(generatedCode);
      setEditableCode(generatedCode);
      setShowDesign(true);
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "Дизайн интерфейса успешно сгенерирован!", sender: 'ai' }]);
    } catch (error) {
      console.error('Error generating UI:', error);
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "Произошла ошибка при генерации интерфейса. Пожалуйста, попробуйте еще раз.", sender: 'ai' }]);
    } finally {
      setIsGeneratingUI(false);
    }
  };

  const handleCreateNewDesign = () => {
    setMessages([{ id: Date.now().toString(), text: "Здравствуйте! Как я могу помочь вам сгенерировать дизайн интерфейса сегодня?", sender: 'ai' }])
    setGeneratedCode('')
    setEditableCode('')
    setCompiledCode(null)
    setShowDesign(false)
    setVersions([])
    setSelectedVersion(null)
  }

  const handleOpenDesignHistory = () => {
    alert('Функция истории дизайнов не реализована в этой демо-версии.')
  }

  const handleCodeChange = useCallback((code: string) => {
    setEditableCode(code)
  }, [])

  const compileCode = () => {
    try {
      const wrappedCode = `
        ${editableCode}
        return GeneratedComponent();
      `;
      
      const renderFunc = new Function(wrappedCode);
      const result = renderFunc();
      setCompiledCode(renderComponent(result));
    } catch (error) {
      console.error('Ошибка компиляции кода:', error);
      setCompiledCode(
        <div className="text-red-500">
          Ошибка компиляции кода: {error instanceof Error ? error.message : 'Неизвестная ошибка'}
          <pre className="mt-2 text-xs whitespace-pre-wrap">{error instanceof Error ? error.stack : ''}</pre>
        </div>
      );
    }
  }

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
          text: "Изображение загружено",
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
              text: "Изображение вставлено",
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
    element.download = "generated-code.js";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(editableCode).then(() => {
      alert("Код скопирован в буфер обмена!");
    }, (err) => {
      console.error('Не удалось скопировать текст: ', err);
      alert("Не удалось скопировать код. Пожалуйста, попробуйте еще раз.");
    });
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className={`flex flex-col ${showDesign ? (isFullscreen ? 'w-0' : 'w-1/2') : 'w-full'} p-4 transition-all duration-300`}>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-[#0053A0]">ИИ Генератор Интерфейса</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCreateNewDesign} className="bg-[#0053A0] text-white hover:bg-[#003D75]">
              <Plus className="h-4 w-4 mr-2" />
              Новый Дизайн
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenDesignHistory} className="bg-[#0053A0] text-white hover:bg-[#003D75]">
              <MessageSquare className="h-4 w-4 mr-2" />
              История Дизайнов
            </Button>
          </div>
        </div>
        <Card className="flex-grow mb-4 shadow-lg border-[#0053A0]">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <CardContent>
              {messages.map((message) => (
                <div key={message.id} className={`mb-4 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block p-3 rounded-lg ${message.sender === 'user' ? 'bg-[#0053A0] text-white' : 'bg-[#E6F0F9] text-[#0053A0]'}`}>
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
        <div className="flex gap-2">
          <Textarea 
            placeholder="Опишите ваш интерфейс..."
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendAndGenerate()}
            onPaste={handlePaste}
            className="flex-grow bg-white text-[#0053A0] min-h-[80px] border-[#0053A0]"
          />
          <div className="flex flex-col gap-2">
            <Button onClick={handleSendAndGenerate} disabled={isGeneratingUI} className="bg-[#0053A0] text-white hover:bg-[#003D75]">
              {isGeneratingUI ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Генерация...
                </>
              ) : (
                <>
                  <SendIcon className="h-4 w-4 mr-2" />
                  Отправить
                </>
              )}
            </Button>
            <Button onClick={handleAddImage} variant="outline" className="border-[#0053A0] text-[#0053A0] hover:bg-[#E6F0F9]">
              <ImageIcon className="h-4 w-4 mr-2" />
              Добавить Изображение
            </Button>
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
        <div className={`${isFullscreen ? 'w-full' : 'w-1/2'} h-screen overflow-auto bg-white border-l border-[#0053A0] p-4 transition-all duration-300`}>
          <Tabs defaultValue="code">
            <div className="flex justify-between items-center mb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="code" className="data-[state=active]:bg-[#0053A0] data-[state=active]:text-white">
                  <Code className="h-4 w-4 mr-2" />
                  Код
                </TabsTrigger>
                <TabsTrigger value="preview" className="data-[state=active]:bg-[#0053A0] data-[state=active]:text-white">
                  <Eye className="h-4 w-4 mr-2" />
                  Предпросмотр
                </TabsTrigger>
              </TabsList>
              <Button variant="outline" size="icon" onClick={toggleFullscreen} className="border-[#0053A0] text-[#0053A0] hover:bg-[#E6F0F9]">
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
            <TabsContent value="code">
              <div className="mb-4">
                <label htmlFor="version-select" className="block text-sm font-medium text-[#0053A0] mb-1">
                  Версия:
                </label>
                <select
                  id="version-select"
                  value={selectedVersion || ''}
                  onChange={(e) => {
                    setSelectedVersion(e.target.value)
                    const selectedVersionCode = versions.find(v => v.id === e.target.value)?.code
                    if (selectedVersionCode) {
                      setEditableCode(selectedVersionCode)
                    }
                  }}
                  className="block w-full mt-1 rounded-md border-[#0053A0] shadow-sm focus:border-[#0053A0] focus:ring focus:ring-[#0053A0] focus:ring-opacity-50"
                >
                  {versions.map((version, index) => (
                    <option key={version.id} value={version.id}>
                      Версия {index + 1}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative border-2 border-[#0053A0] rounded-lg overflow-hidden shadow-lg">
                <Editor
                  value={editableCode}
                  onValueChange={handleCodeChange}
                  highlight={(code) => highlight(code, languages.tsx)}
                  padding={20}
                  style={{
                    fontFamily: '"Fira Code", "Fira Mono", monospace',
                    fontSize: 14,
                    lineHeight: 1.6,
                    height: 'calc(100vh - 350px)',
                    overflow: 'auto',
                    backgroundColor: '#f8f9fa',
                  }}
                  textareaClassName="focus:outline-none"
                  className="min-h-[400px] focus-within:shadow-outline-blue"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button variant="outline" size="icon" onClick={handleDownloadCode} className="bg-white text-[#0053A0] hover:bg-[#E6F0F9] border-[#0053A0]">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleCopyCode} className="bg-white text-[#0053A0] hover:bg-[#E6F0F9] border-[#0053A0]">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button onClick={compileCode} className="mt-6 bg-[#0053A0] text-white hover:bg-[#003D75]">
                Компилировать и Просмотреть
              </Button>
            </TabsContent>
            <TabsContent value="preview">
              <div className="border border-[#0053A0] rounded-lg p-4 h-[calc(100vh-200px)] overflow-auto">
                {compiledCode}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}

export default UiGenerator