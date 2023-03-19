import React from 'react';
import LoginProtector from "@/components/LoginProtector";
import { ReactNode, useEffect, useRef, useState } from "react";
import { AppToaster } from '@/toaster';
import { Card, H5, Classes, InputGroup, Button, Callout } from '@blueprintjs/core';
import { Tooltip2 } from '@blueprintjs/popover2';

interface SearchResult {
  query: string;
  response: string;
}

const lorem: SearchResult = {
  query: "Lorem Ipsum Demet IpsumLorem Ipsum Demet Ipsum",
  response: "Lorem Ipsum Demet Ipsum Lorem Ipsum Demet IpsumLorem Ipsum Demet IpsumLorem Ipsum Demet IpsumLorem Ipsum Demet IpsumLorem Ipsum Demet IpsumLorem Ipsum Demet IpsumLorem Ipsum Demet IpsumLorem Ipsum Demet IpsumLorem Ipsum Demet IpsumLorem Ipsum Demet IpsumLorem Ipsum Demet IpsumLorem Ipsum Demet IpsumLorem Ipsum Demet IpsumLorem Ipsum Demet Ipsum",
};

export default function Home() {
  const [results, setResults] = useState<SearchResult[]>([]);

  const [searchValue, setSearchValue] = useState('');

  const [isSearching, setIsSearching] = useState(false);

  const search = async () => {
    setIsSearching(true);

    const result = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchValue })
    });

    setIsSearching(false);

    if (!result.ok) {
      AppToaster?.show({
        message: 'An error occurred while searching. Please try again later.',
        intent: 'warning',
        icon: 'error'
      });
      return;
    }

    const jsonResult = await result.json();

    let searchResult: SearchResult = {
      query: searchValue,
      response: jsonResult.response
    };

    setResults(r => [...r, searchResult]);
    setSearchValue('');
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

  const searchBar = (
    <div className='flex flex-row pt-2'>
      <div className="flex-grow">
        <InputGroup
          large
          type='search'
          leftIcon='search'
          placeholder="Search..."
          disabled={isSearching}
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
        />
      </div>

      <Button
        disabled={searchValue.trim() === ''}
        onClick={search}
        loading={isSearching}
        className='ml-2'
        rightIcon='arrow-right'
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

          {results.map(result => <>
            <div className='flex w-full justify-end'>
              <Callout icon='help' className='w-fit max-w-xl' intent='primary'>
                {result.query}
              </Callout>
            </div>

            <Callout icon='chat' className='max-w-xl'>
              {result.response}
            </Callout>
          </>)}
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