import { useApi } from '@/api/api';
import { AppToaster } from '@/utils/toaster';
import { Button, Callout, InputGroup } from '@blueprintjs/core';
import { useEffect, useRef, useState } from 'react';

interface Result {
  query: string;
  response: string;
}

interface Props {
  initialResponse?: string;
  loading?: boolean;
}

const ChatBox = ({ initialResponse, loading: _loading }: Props) => {
  const { streamChat } = useApi();

  const [results, setResults] = useState<Result[]>(initialResponse ? [{
    query: '',
    response: initialResponse
  }] : []);

  useEffect(() => {
    if (initialResponse) {
      setResults(r => {
        r[0] = {
          query: '',
          response: initialResponse
        };
        return r;
      });
    }
  }, [initialResponse]);

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.scrollIntoView({ behavior: 'smooth' });
  }, [results]);

  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');

  const search = async () => {
    setIsSearching(true);

    const iterator = streamChat({
      query,
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
          query,
          response: text
        };
        return newResults;
      });
    }

    setQuery('');
    setIsSearching(false);
  };

  const loading = isSearching || _loading;
  const canSearch = query.trim() !== '' && !loading;

  const onCopyClick = (index: number) => () => {
    const result = results[index];
    navigator.clipboard.writeText(result.response);
    AppToaster?.show({ message: 'Copied to clipboard', intent: 'success' });
  };

  return (
    <div className='flex flex-col h-full max-w-3xl ml-auto mr-auto md:pb-4 px-2'>
      {results.length !== 0 && (
        <div className="h-full overflow-y-auto space-y-2 md:px-2">
          {results.map((result, index) =>
            <div key={index} className='space-y-2'>
              {result.query && (
                <div className='flex w-full justify-end'>
                  <Callout icon='help' className='w-fit max-w-xl' intent='primary'>
                    <p>{result.query}</p>
                  </Callout>
                </div>
              )}

              <Callout icon='chat' className='group max-w-xl whitespace-pre-wrap relative mt-6'>
                {result.response}
                {(loading && index === results.length - 1) && (
                  <div className='inline-flex ml-1 h-3 w-2 bg-white blinking' />
                )}
                {(index < results.length - 1 || !loading) && (
                  <Button icon='clipboard' className='loadingButton invisible group-hover:visible absolute -top-4 -right-7' onClick={onCopyClick(index)}>
                    Copy
                  </Button>
                )}
              </Callout>
            </div>
          )}
          <div ref={ref} />
        </div>
      )}

      <div className='flex flex-row pt-2'>
        <InputGroup
          large
          type='search'
          leftIcon='search'
          placeholder={`Ask the AI a question...`}
          disabled={loading}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => (e.key === 'Enter' && canSearch) && search()}
          className='w-full'
        />

        <Button
          disabled={!canSearch}
          onClick={search}
          loading={loading}
          className='ml-2 h-min'
          rightIcon='arrow-right'
          large
        >
          <div className="hidden md:block">
            Search
          </div>
        </Button>
      </div>
    </div>
  );
};

export default ChatBox;