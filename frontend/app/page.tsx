import UiGeneratorWrapper from '@/components/UiGeneratorWrapper'
import axios from 'axios';

export default function Home() {
  const handleGenerateCode = async () => {
    try {
      // ... existing code generation logic ...

      // Send the generated code to the preview API
      const response = await axios.post('http://localhost:5000/preview', { code: generatedCode });
      
      if (response.status === 200) {
        console.log('Code successfully sent for preview');
        // You might want to trigger a refresh of the preview here
      } else {
        console.error('Failed to send code for preview');
      }
    } catch (error) {
      console.error('Error generating or previewing code:', error);
    }
  };

  return (
    <main>
      <UiGeneratorWrapper />
    </main>
  )
}