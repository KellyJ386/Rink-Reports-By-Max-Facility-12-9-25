'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  CodeBracketIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

interface OpenApiSpec {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
  };
  tags: { name: string; description: string }[];
  paths: Record<string, Record<string, PathOperation>>;
  components: {
    schemas: Record<string, SchemaObject>;
  };
}

interface PathOperation {
  tags: string[];
  summary: string;
  description?: string;
  parameters?: Parameter[];
  requestBody?: {
    content: {
      'application/json': {
        schema: SchemaObject | { $ref: string };
      };
    };
  };
  responses: Record<string, { description: string; content?: unknown }>;
}

interface Parameter {
  name: string;
  in: string;
  required?: boolean;
  schema: { type: string; enum?: string[]; default?: unknown };
  description?: string;
}

interface SchemaObject {
  type?: string;
  properties?: Record<string, SchemaObject | { $ref: string }>;
  items?: SchemaObject | { $ref: string };
  enum?: string[];
  required?: string[];
  format?: string;
}

const methodColors: Record<string, string> = {
  get: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  post: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  put: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  patch: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  delete: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<OpenApiSpec | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set(['Ice Resurfacing', 'Incidents']));
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/docs')
      .then((res) => res.json())
      .then((data) => {
        setSpec(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load API docs:', err);
        setIsLoading(false);
      });
  }, []);

  const togglePath = (pathKey: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(pathKey)) {
        next.delete(pathKey);
      } else {
        next.add(pathKey);
      }
      return next;
    });
  };

  const toggleTag = (tag: string) => {
    setExpandedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const copyEndpoint = (path: string, method: string) => {
    const endpoint = `${method.toUpperCase()} /api${path}`;
    navigator.clipboard.writeText(endpoint);
    setCopiedEndpoint(`${path}-${method}`);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const getPathsByTag = (tag: string) => {
    if (!spec) return [];

    const result: { path: string; method: string; operation: PathOperation }[] = [];

    Object.entries(spec.paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, operation]) => {
        if (operation.tags?.includes(tag)) {
          result.push({ path, method, operation });
        }
      });
    });

    return result;
  };

  const resolveRef = (ref: string): SchemaObject | null => {
    if (!spec || !ref.startsWith('#/components/schemas/')) return null;
    const schemaName = ref.replace('#/components/schemas/', '');
    return spec.components.schemas[schemaName] || null;
  };

  const renderSchema = (schema: SchemaObject | { $ref: string }, depth = 0): React.ReactNode => {
    if ('$ref' in schema) {
      const resolved = resolveRef(schema.$ref);
      if (!resolved) return <span className="text-rink-500">Unknown</span>;
      return renderSchema(resolved, depth);
    }

    if (schema.type === 'array' && schema.items) {
      return (
        <span>
          Array&lt;{renderSchema(schema.items, depth)}&gt;
        </span>
      );
    }

    if (schema.type === 'object' && schema.properties) {
      if (depth > 1) return <span className="text-ice-600">object</span>;

      return (
        <div className="ml-4 border-l border-rink-200 dark:border-rink-700 pl-4 mt-2">
          {Object.entries(schema.properties).map(([key, prop]) => (
            <div key={key} className="py-1">
              <span className="font-mono text-sm text-rink-700 dark:text-rink-300">
                {key}
                {schema.required?.includes(key) && <span className="text-red-500">*</span>}
              </span>
              <span className="text-rink-400 mx-2">:</span>
              <span className="text-ice-600 dark:text-ice-400 text-sm">
                {renderSchema(prop, depth + 1)}
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (schema.enum) {
      return (
        <span className="text-purple-600 dark:text-purple-400">
          {schema.enum.join(' | ')}
        </span>
      );
    }

    return <span className="text-ice-600 dark:text-ice-400">{schema.type || 'any'}</span>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-ice-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-2 text-rink-500">Loading API documentation...</p>
        </div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load API documentation</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <CodeBracketIcon className="w-8 h-8 text-ice-500" />
            API Documentation
          </h1>
          <p className="page-description">
            {spec.info.description}
          </p>
        </div>
        <Badge variant="primary">v{spec.info.version}</Badge>
      </div>

      {/* Quick Info */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-rink-500 dark:text-rink-400">Base URL</h3>
            <code className="text-sm font-mono text-rink-900 dark:text-rink-100 bg-rink-100 dark:bg-rink-800 px-2 py-1 rounded mt-1 inline-block">
              /api
            </code>
          </div>
          <div>
            <h3 className="text-sm font-medium text-rink-500 dark:text-rink-400">Authentication</h3>
            <p className="text-sm text-rink-700 dark:text-rink-300 mt-1">
              Session-based (NextAuth cookies)
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-rink-500 dark:text-rink-400">Format</h3>
            <p className="text-sm text-rink-700 dark:text-rink-300 mt-1">
              JSON (application/json)
            </p>
          </div>
        </div>
      </Card>

      {/* Endpoints by Tag */}
      <div className="space-y-4">
        {spec.tags.map((tag) => {
          const paths = getPathsByTag(tag.name);
          if (paths.length === 0) return null;

          const isExpanded = expandedTags.has(tag.name);

          return (
            <Card key={tag.name} padding="none">
              {/* Tag Header */}
              <button
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-rink-50 dark:hover:bg-rink-800/50 transition-colors"
                onClick={() => toggleTag(tag.name)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDownIcon className="w-5 h-5 text-rink-400" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-rink-400" />
                  )}
                  <h2 className="text-lg font-semibold text-rink-900 dark:text-rink-100">
                    {tag.name}
                  </h2>
                  <Badge variant="secondary">{paths.length}</Badge>
                </div>
                <p className="text-sm text-rink-500 dark:text-rink-400 hidden sm:block">
                  {tag.description}
                </p>
              </button>

              {/* Endpoints */}
              {isExpanded && (
                <div className="border-t border-rink-200 dark:border-rink-700">
                  {paths.map(({ path, method, operation }) => {
                    const pathKey = `${path}-${method}`;
                    const isPathExpanded = expandedPaths.has(pathKey);

                    return (
                      <div
                        key={pathKey}
                        className="border-b border-rink-100 dark:border-rink-800 last:border-0"
                      >
                        {/* Endpoint Header */}
                        <button
                          className="w-full flex items-center gap-4 px-6 py-3 hover:bg-rink-50 dark:hover:bg-rink-800/30 transition-colors"
                          onClick={() => togglePath(pathKey)}
                        >
                          <Badge className={methodColors[method]}>
                            {method.toUpperCase()}
                          </Badge>
                          <code className="text-sm font-mono text-rink-700 dark:text-rink-300 flex-1 text-left">
                            /api{path}
                          </code>
                          <span className="text-sm text-rink-500 dark:text-rink-400 hidden md:block">
                            {operation.summary}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyEndpoint(path, method);
                            }}
                            className="p-1 hover:bg-rink-200 dark:hover:bg-rink-700 rounded"
                          >
                            {copiedEndpoint === pathKey ? (
                              <CheckIcon className="w-4 h-4 text-green-500" />
                            ) : (
                              <ClipboardDocumentIcon className="w-4 h-4 text-rink-400" />
                            )}
                          </button>
                        </button>

                        {/* Endpoint Details */}
                        {isPathExpanded && (
                          <div className="px-6 py-4 bg-rink-50 dark:bg-rink-800/30 space-y-4">
                            {/* Description */}
                            {operation.description && (
                              <p className="text-sm text-rink-600 dark:text-rink-400">
                                {operation.description}
                              </p>
                            )}

                            {/* Parameters */}
                            {operation.parameters && operation.parameters.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-rink-700 dark:text-rink-300 mb-2">
                                  Parameters
                                </h4>
                                <div className="bg-white dark:bg-rink-900 rounded-lg border border-rink-200 dark:border-rink-700 overflow-hidden">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b border-rink-200 dark:border-rink-700">
                                        <th className="px-4 py-2 text-left text-rink-500 dark:text-rink-400 font-medium">
                                          Name
                                        </th>
                                        <th className="px-4 py-2 text-left text-rink-500 dark:text-rink-400 font-medium">
                                          In
                                        </th>
                                        <th className="px-4 py-2 text-left text-rink-500 dark:text-rink-400 font-medium">
                                          Type
                                        </th>
                                        <th className="px-4 py-2 text-left text-rink-500 dark:text-rink-400 font-medium">
                                          Required
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {operation.parameters.map((param) => (
                                        <tr
                                          key={param.name}
                                          className="border-b border-rink-100 dark:border-rink-800 last:border-0"
                                        >
                                          <td className="px-4 py-2 font-mono text-rink-700 dark:text-rink-300">
                                            {param.name}
                                          </td>
                                          <td className="px-4 py-2 text-rink-500 dark:text-rink-400">
                                            {param.in}
                                          </td>
                                          <td className="px-4 py-2 text-ice-600 dark:text-ice-400">
                                            {param.schema.enum
                                              ? param.schema.enum.join(' | ')
                                              : param.schema.type}
                                          </td>
                                          <td className="px-4 py-2">
                                            {param.required ? (
                                              <Badge variant="danger">Yes</Badge>
                                            ) : (
                                              <span className="text-rink-400">No</span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Request Body */}
                            {operation.requestBody && (
                              <div>
                                <h4 className="text-sm font-semibold text-rink-700 dark:text-rink-300 mb-2">
                                  Request Body
                                </h4>
                                <div className="bg-white dark:bg-rink-900 rounded-lg border border-rink-200 dark:border-rink-700 p-4">
                                  {renderSchema(operation.requestBody.content['application/json'].schema)}
                                </div>
                              </div>
                            )}

                            {/* Responses */}
                            <div>
                              <h4 className="text-sm font-semibold text-rink-700 dark:text-rink-300 mb-2">
                                Responses
                              </h4>
                              <div className="space-y-2">
                                {Object.entries(operation.responses).map(([code, response]) => (
                                  <div
                                    key={code}
                                    className="flex items-center gap-3 text-sm"
                                  >
                                    <Badge
                                      className={
                                        code.startsWith('2')
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                          : code.startsWith('4')
                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                      }
                                    >
                                      {code}
                                    </Badge>
                                    <span className="text-rink-600 dark:text-rink-400">
                                      {response.description}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Schemas Section */}
      <Card>
        <h2 className="text-lg font-semibold text-rink-900 dark:text-rink-100 mb-4">
          Data Schemas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.keys(spec.components.schemas).map((schemaName) => (
            <Badge key={schemaName} variant="secondary" className="justify-center">
              {schemaName}
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}
