import React, { ReactNode, useEffect, useRef, useState } from 'react';
import LoginProtector from "@/components/LoginProtector";
import { Card, H5, Classes, InputGroup, Button, Callout, FormGroup, H6 } from '@blueprintjs/core';
import { Popover2, Tooltip2 } from '@blueprintjs/popover2';
import { useRequests } from '@/utils/http';

interface SearchResult {
  query: string;
  chatQuery: string;
  response: string;
}

const aiPrompt = 'AI prompt';
const searchPrompt = 'Search files';

export default function Home() {
  const requests = useRequests();

  const [results, setResults] = useState<SearchResult[]>([]);

  const [searchValue, setSearchValue] = useState('');
  const [chatSearchValue, setChatSearchValue] = useState('');

  const [isSearching, setIsSearching] = useState(false);

  const canSearch = searchValue.trim() !== '';

  const search = async () => {
    setIsSearching(true);

    const iterator = requests.stream('/search', {
      query: chatSearchValue.trim() || searchValue,
      searchQuery: chatSearchValue.trim() !== '' ? searchValue : undefined,
      history: results.map(result => ({
        user: result.query,
        assistant: result.response
      }))
    });

    let text = "";
    const resultsIndex = results.length;

    for await (const value of iterator) {
      text += value;

      setResults(results => {
        const newResults = [...results];
        newResults[resultsIndex] = {
          query: searchValue,
          chatQuery: chatSearchValue,
          response: text
        };
        return newResults;
      });
    }

    setSearchValue('');
    setChatSearchValue('');
    setIsSearching(false);
  };

  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.scrollIntoView({ behavior: 'smooth' });
  }, [results]);

  const welcomeCard = (
    <div className="h-full flex items-center justify-center">
      <Card className="max-w-md space-y-2">
        <H5>Welcome to Semantic Search!</H5>

        <div>{"We've hooked up some IB documents to an "}
          <Tooltip2 position="top" content="That's right, ChatGPT!" className={Classes.TOOLTIP_INDICATOR}>
            Artificial Intelligence
          </Tooltip2>
          {", allowing it to answer your questions. Try it out, ask a question!"}</div>

        <div>It may take up to a few seconds for a response, so please be patient.</div>
      </Card>
    </div>
  );

  const [advancedSearch, _setAdvancedSearch] = useState(false);
  const setAdvancedSearch = (value: boolean) => {
    _setAdvancedSearch(value);
    setChatSearchValue('');
  };

  const searchBar = (
    <div className='flex flex-row pt-2'>
      <div className="flex-grow">
        <FormGroup
          helperText={<>
            <Button disabled={isSearching} minimal small className='ml-2' onClick={() => setAdvancedSearch(!advancedSearch)}>
              Advanced Search
            </Button>
            <Popover2
              content={(
                <div className='max-w-xs p-2 space-y-1'>
                  <H6>Advanced search</H6>
                  <p>
                    This feature allows you to customize what prompt the AI gets.
                    This is useful if you want the AI to do something specific,
                    and can improve search results if your prompt contains information for only the AI.
                    For Example:
                  </p>

                  <p>
                    <b>{`${searchPrompt}: `}</b> <i>What is the purpose of the library?</i>
                  </p>

                  <p>
                    <b>{`${aiPrompt}: `}</b> <i>Please summarize the purpose of a library in IB in 3 bullet points.</i>
                  </p>
                </div>
              )}
              renderTarget={({ isOpen, ref, ...targetProps }) => (
                <Button minimal small icon='help' elementRef={ref} {...targetProps} />
              )}
            />
          </>}
          className='m-0'
        >
          <InputGroup
            large
            type='search'
            leftIcon='search'
            placeholder={`${searchPrompt}...`}
            disabled={isSearching}
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            onKeyDown={e => (e.key === 'Enter' && canSearch) && search()}
          />
          {(advancedSearch) && (
            <InputGroup
              type='search'
              placeholder={aiPrompt}
              disabled={isSearching}
              value={chatSearchValue}
              onChange={e => setChatSearchValue(e.target.value)}
              onKeyDown={e => (e.key === 'Enter' && canSearch) && search()}
              className='mt-1'
            />
          )}
        </FormGroup>
      </div>

      <Button
        disabled={!canSearch}
        onClick={search}
        loading={isSearching}
        className='ml-2 h-min'
        rightIcon='arrow-right'
        large
      >
        <div className="hidden md:block">
          Search
        </div>
      </Button>
    </div>
  );

  return (
    <div className='flex flex-col h-full max-w-3xl ml-auto mr-auto md:py-4 p-2'>
      {results.length === 0 ? (welcomeCard) : (
        <div className="h-full overflow-y-auto space-y-2 md:px-2">
          {results.map((result, index) =>
            <div key={index} className='space-y-2'>
              <div className='flex w-full justify-end'>
                <Callout icon='help' className='w-fit max-w-xl' intent='primary'>
                  <p>
                    {result.query}
                  </p>
                  {result.chatQuery !== "" && (
                    <p>
                      <b>{`${aiPrompt}: `}</b> {result.chatQuery}
                    </p>
                  )}
                </Callout>
              </div>

              <Callout icon='chat' className='max-w-xl whitespace-pre-wrap'>
                {result.response}
                {(isSearching && index === results.length - 1) && (
                  <div className='inline-flex ml-1 h-3 w-2 bg-white blinking' />
                )}
              </Callout>
            </div>
          )}
          <div ref={ref} />
        </div>
      )}

      {searchBar}
    </div>
  );
};

Home.getLayout = (page: ReactNode) => {
  return (
    <LoginProtector>
      {page}
    </LoginProtector>
  );
};