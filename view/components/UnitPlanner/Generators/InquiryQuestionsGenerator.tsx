import { useRequests } from '@/utils/http';
import { Button } from '@blueprintjs/core';
import { generateConceptualUnderstandingsPrompt } from './StandardGenerators';
import { useState } from 'react';
import OutputDialog from '../OutputDialog';
import wait from '@/utils/wait';

const generateInquiryQuestionsPrompt = (syllabusContent: string[], conceptualUnderstandings: string) => {
  let prompt = `You are IB Business management teacher that helps me to plan inquiry-based learning unit. 
  Your task is to generate three categories for student inquiry: factual, conceptual, debatable. 
  You should base your factual questions on "${syllabusContent.join(', ')}"; 
  You should base your debatable and conceptual questions on "${conceptualUnderstandings}".
  
  Here is some additional information about good inquiry questions. Use it as a guide for your creation.
  
  Factual questions should be Knowledge/fact-based,
  Content-driven, Skills-related, Supported by evidence,
  Can be used to explore terminology in the statement of inquiry, 
  Frequently topical, Encourage recall and comprehension, 
  
  Conceptual questions should Enable exploration of big ideas that connect facts and topics, 
  Highlight opportunities to compare and contrast, 
  Explore contradictions, 
  Lead to deeper disciplinary and interdisciplinary understanding, 
  Promote transfer to familiar or less familiar situations, issues, ideas and contexts, 
  Encourage analysis and application, 
  Enable the use of facts and concepts to debate a position
  
  Debatable questions should Promote discussion, 
  Explore significant ideas and issues from multiple perspectives, 
  Can be contested, 
  Have tension, 
  May be deliberately provocative, 
  Encourage synthesis and evaluation`;

  return prompt;
};

interface Props {
  syllabusContent: string[];
  keyConcepts: string[];
  subjectAims: string[];
  contextOfInterest: string[];
}

const InquiryQuestionsGenerator = ({ syllabusContent, keyConcepts, subjectAims, contextOfInterest }: Props) => {
  const { stream } = useRequests();

  const [inquiryQuestionsLoading, setInquiryQuestionsLoading] = useState<boolean>(false);
  const [conceptualUnderstandingsLoading, setConceptualUnderstandingsLoading] = useState<boolean>(false);
  const [inquiryQuestions, setInquiryQuestions] = useState<string>();

  const [outputDialogOpen, setOutputDialogOpen] = useState<boolean>(false);

  const onInquiryClicked = async () => {
    setOutputDialogOpen(true);
    setInquiryQuestions('');

    const conceptualUnderstandingsPrompt = generateConceptualUnderstandingsPrompt(syllabusContent, keyConcepts, subjectAims);

    let conceptualUnderstandings = '';
    {
      setConceptualUnderstandingsLoading(true);
      const output = stream('/chat', { query: conceptualUnderstandingsPrompt, history: [] });

      for await (const chunk of output) {
        conceptualUnderstandings += chunk;
      }
      setConceptualUnderstandingsLoading(false);
    }

    const inquiryQuestionsPrompt = generateInquiryQuestionsPrompt(syllabusContent, conceptualUnderstandings);

    await wait(2000);

    setInquiryQuestionsLoading(true);
    const output = stream('/chat', { query: inquiryQuestionsPrompt, history: [] });

    let text = '';
    for await (const chunk of output) {
      setInquiryQuestions(iq => iq + chunk);
      text += chunk;
    }
    setInquiryQuestions(text);
    setInquiryQuestionsLoading(false);
  };

  return <>
    <Button
      className='w-full justify-start'
      onClick={onInquiryClicked}
      intent='primary'
      icon='help'
    >
      Inquiry Questions
    </Button>

    <OutputDialog
      isOpen={outputDialogOpen}
      onClose={() => setOutputDialogOpen(false)}
      loading={inquiryQuestionsLoading || conceptualUnderstandingsLoading}
    >
      {conceptualUnderstandingsLoading && 'Please wait, generating conceptual understandings...'}

      {inquiryQuestions}
    </OutputDialog>
  </>;
};

export default InquiryQuestionsGenerator;