import React, { useState, useEffect, useRef } from 'react';
import {
  ALGOLIA_API_KEY,
  ALGOLIA_APPLICATION_ID,
  ALGOLIA_DEFAULT_INDEX, // eslint-disable-line
} from '@codesandbox/common/lib/utils/config';
import * as algoliasearch from 'algoliasearch';
import { useKey } from 'react-use';
import { Scrollable } from '@codesandbox/common/lib/components/Scrollable';
import { Pagination } from '@codesandbox/common/lib/components/Pagination';
import { Header } from '../elements';
import { SandboxCard } from '../SandboxCard';
import { makeTemplates, useDebounce } from './utils';
import { Loader } from '../Loader';
import { SubHeader } from '../Create/elements';
import {
  Grid,
  Results,
  Search,
  Categories,
  Form,
  InputWrapper,
} from './elements';
import { all } from '../availableTemplates';

const client = algoliasearch(ALGOLIA_APPLICATION_ID, ALGOLIA_API_KEY);
const index = client.initIndex('staging_sandboxes');

const paginate = (array: any[], pageSize: number, pageNumber: number) =>
  array.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize);

export const Explore = () => {
  const searchEl = useRef(null);
  const [templates, setTemplates] = useState();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [allPages, setAllPages] = useState(1);
  const [page, setPage] = useState(0);
  const perPage = 10;
  const query = useDebounce(search, 300);
  useKey('/', () => {
    window.setTimeout(() => {
      searchEl.current.focus();
    });
  });

  useEffect(() => {
    if (query || category) {
      setPage(0);
    }
    if (page <= allPages) {
      index
        .search({
          facetFilters: ['custom_template.published: true', category],
          hitsPerPage: perPage,
          query,
          page,
        })
        .then(rsp => {
          setAllPages(rsp.nbPages);
          const newTemplates = makeTemplates(rsp.hits);
          if (page === 0) return setTemplates(newTemplates);

          return setTemplates(t => t.concat(newTemplates));
        });
    }
  }, [allPages, category, page, query]);

  const updateCategory = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value !== '') {
      return setCategory(`template: ${e.target.value}`);
    }

    return setCategory('');
  };

  return (
    <>
      <Header>
        <span>Explore Templates</span>
        <Form>
          <InputWrapper>
            <Search
              value={search}
              placeholder="Search"
              ref={searchEl}
              onChange={e => setSearch(e.target.value)}
            />
          </InputWrapper>
          <Categories onChange={updateCategory}>
            <option selected value="">
              Categories
            </option>
            {all.map(template => (
              <option value={template.name}>{template.niceName}</option>
            ))}
          </Categories>
        </Form>
      </Header>

      {templates ? (
        <Scrollable>
          {templates.length ? (
            <Results>
              <SubHeader>
                {category
                  ? all.find(
                      temp => temp.name === category.split(':')[1].trim()
                    ).niceName
                  : 'All'}{' '}
                Templates
              </SubHeader>
              <Grid>
                {paginate(templates, perPage, page).map(sandbox => (
                  <SandboxCard key={sandbox.objectID} template={sandbox} />
                ))}
              </Grid>
              <Pagination
                pages={allPages}
                onChange={destination => {
                  setPage(destination);
                }}
              />
            </Results>
          ) : (
            <SubHeader
              css={`
                text-align: center;
                margin-top: 2rem;
              `}
            >
              There are no templates matching your search.
            </SubHeader>
          )}
        </Scrollable>
      ) : (
        <Loader />
      )}
    </>
  );
};