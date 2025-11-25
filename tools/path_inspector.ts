interface PathInspection {
  PATH: string[];
  JAVA_HOME?: string;
  ANDROID_HOME?: string;
  GRADLE_HOME?: string;
  FLUTTER_HOME?: string;
  DART_HOME?: string;
  NODE_HOME?: string;
  PYTHON_HOME?: string;
  allEnvVars: Record<string, string>;
}

export function getPathInspection(): PathInspection {
  const env = process.env;

  const pathSeparator = process.platform === 'win32' ? ';' : ':';
  const pathArray = (env.PATH || '').split(pathSeparator).filter(p => p.trim() !== '');

  const result: PathInspection = {
    PATH: pathArray,
    allEnvVars: {}
  };

  // Extract important environment variables
  if (env.JAVA_HOME) result.JAVA_HOME = env.JAVA_HOME;
  if (env.ANDROID_HOME) result.ANDROID_HOME = env.ANDROID_HOME;
  if (env.ANDROID_SDK_ROOT) result.ANDROID_HOME = env.ANDROID_SDK_ROOT;
  if (env.GRADLE_HOME) result.GRADLE_HOME = env.GRADLE_HOME;
  if (env.FLUTTER_HOME) result.FLUTTER_HOME = env.FLUTTER_HOME;
  if (env.FLUTTER_ROOT) result.FLUTTER_HOME = env.FLUTTER_ROOT;
  if (env.DART_HOME) result.DART_HOME = env.DART_HOME;
  if (env.NODE_HOME) result.NODE_HOME = env.NODE_HOME;
  if (env.PYTHON_HOME) result.PYTHON_HOME = env.PYTHON_HOME;

  // Capture all environment variables for comprehensive analysis
  for (const [key, value] of Object.entries(env)) {
    if (value !== undefined) {
      result.allEnvVars[key] = value;
    }
  }

  return result;
}
