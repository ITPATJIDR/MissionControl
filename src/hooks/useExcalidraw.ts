import { useState, useEffect, useRef, useCallback } from "react";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { Project, SaveStatus } from "../types";
import { apiService } from "../services/api";

export const useExcalidraw = (currentProject: Project | null) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [excalidrawInitialized, setExcalidrawInitialized] = useState(false);
  const [shouldReloadExcalidraw, setShouldReloadExcalidraw] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  // Refs for tracking state
  const currentProjectRef = useRef<Project | null>(null);
  const lastSavedElements = useRef<string>('');
  const isSaving = useRef<boolean>(false);

  // Update the ref whenever currentProject changes
  useEffect(() => {
    currentProjectRef.current = currentProject;
  }, [currentProject]);

  // Auto-save functionality
  useEffect(() => {
    if (!excalidrawAPI || !excalidrawInitialized || shouldReloadExcalidraw || !currentProject) {
      return;
    }

    const saveExcalidrawData = async (force = false) => {
      // Prevent concurrent saves
      if (isSaving.current) {
        return;
      }

      try {
        isSaving.current = true;
        const elements = excalidrawAPI.getSceneElements();
        const appState = excalidrawAPI.getAppState();
        
        const currentElementsString = JSON.stringify(elements);
        
        // Only save if there are actual changes (or forced)
        if (!force && currentElementsString === lastSavedElements.current) {
          return; // No changes, skip save
        }

        // For non-forced saves, only save if there are elements
        // For forced saves (like on app close), save regardless
        const hasElements = elements && elements.length > 0;
        if (!force && !hasElements) {
          return; // Don't save empty canvas unless forced
        }

        setSaveStatus('saving');

        await apiService.saveExcalidrawData(
          currentElementsString,
          JSON.stringify({
            zenModeEnabled: appState.zenModeEnabled,
            viewBackgroundColor: appState.viewBackgroundColor,
          }),
          currentProject.id
        );
        
        // Update the last saved state
        lastSavedElements.current = currentElementsString;
        
        setSaveStatus('success');
        
        // Clear success status after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } finally {
        isSaving.current = false;
      }
    };

    // Check for changes every 2 seconds and save if needed
    const interval = setInterval(() => {
      if (!isSaving.current) {
        const elements = excalidrawAPI.getSceneElements();
        const currentElementsString = JSON.stringify(elements);
        
        if (currentElementsString !== lastSavedElements.current) {
          saveExcalidrawData();
        }
      }
    }, 2000);

    // Save on app close/unload
    const handleBeforeUnload = () => {
      if (!shouldReloadExcalidraw && !isSaving.current) {
        saveExcalidrawData(true); // Force save on close
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [excalidrawAPI, excalidrawInitialized, shouldReloadExcalidraw, currentProject]);

  // Handle project switching
  useEffect(() => {
    if (currentProject) {
      const saveBeforeSwitch = async () => {
        if (excalidrawAPI && excalidrawInitialized && !shouldReloadExcalidraw) {
          try {
            const elements = excalidrawAPI.getSceneElements();
            const appState = excalidrawAPI.getAppState();
            const currentElementsString = JSON.stringify(elements);

            // Save to the previous project if there was one and there are changes
            const previousProjectId = currentProjectRef.current?.id;
            if (previousProjectId && previousProjectId !== currentProject.id && currentElementsString !== lastSavedElements.current) {
              setSaveStatus('saving');
              
              await apiService.saveExcalidrawData(
                currentElementsString,
                JSON.stringify({
                  zenModeEnabled: appState.zenModeEnabled,
                  viewBackgroundColor: appState.viewBackgroundColor,
                }),
                previousProjectId
              );
              
              setSaveStatus('success');
              setTimeout(() => setSaveStatus('idle'), 1000);
            }
          } catch (error) {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 2000);
          }
        }
        
        // Reset excalidraw state to force reload of new project data
        setExcalidrawInitialized(false);
        setShouldReloadExcalidraw(true);
      };

      saveBeforeSwitch();
    }
  }, [currentProject, excalidrawAPI, excalidrawInitialized, shouldReloadExcalidraw]);

  // Load Excalidraw data for current project
  useEffect(() => {
    const loadExcalidrawData = async () => {
      if (excalidrawAPI && currentProject && (!excalidrawInitialized || shouldReloadExcalidraw)) {
        try {
          setSaveStatus('idle'); // Clear any previous save status
          
          const savedData = await apiService.getExcalidrawData(currentProject.id);

          if (savedData) {
            const elements = JSON.parse(savedData.elements);
            const appState = JSON.parse(savedData.app_state);

            await new Promise(resolve => setTimeout(resolve, 100));

            excalidrawAPI.updateScene({
              elements,
              appState: {
                ...appState,
                zenModeEnabled: appState.zenModeEnabled || false,
              }
            });

            // Update the last saved state
            lastSavedElements.current = savedData.elements;
          } else {
            // Clear the canvas if no data for this project
            excalidrawAPI.updateScene({
              elements: [],
              appState: { zenModeEnabled: false }
            });
            
            // Reset last saved state
            lastSavedElements.current = '[]';
          }

          setExcalidrawInitialized(true);
          setShouldReloadExcalidraw(false);
        } catch (error) {
          setExcalidrawInitialized(true);
          setShouldReloadExcalidraw(false);
        }
      }
    };

    loadExcalidrawData();
  }, [excalidrawAPI, excalidrawInitialized, shouldReloadExcalidraw, currentProject]);

  const saveCurrentData = useCallback(async () => {
    if (excalidrawAPI && excalidrawInitialized && currentProject && !shouldReloadExcalidraw) {
      try {
        // Wait for any ongoing save to complete
        while (isSaving.current) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        isSaving.current = true;
        const elements = excalidrawAPI.getSceneElements();
        const appState = excalidrawAPI.getAppState();
        const currentElementsString = JSON.stringify(elements);
        
        // Only save if there are changes AND there are actual elements to save
        const hasElements = elements && elements.length > 0;
        const hasChanges = currentElementsString !== lastSavedElements.current;
        
        if (hasChanges && hasElements) {
          setSaveStatus('saving');
          
          await apiService.saveExcalidrawData(
            currentElementsString,
            JSON.stringify({
              zenModeEnabled: appState.zenModeEnabled,
              viewBackgroundColor: appState.viewBackgroundColor,
            }),
            currentProject.id
          );
          
          // Update the last saved state
          lastSavedElements.current = currentElementsString;
          setSaveStatus('success');
          setTimeout(() => setSaveStatus('idle'), 1000);
        }
      } catch (error) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } finally {
        isSaving.current = false;
      }
    }
  }, [excalidrawAPI, excalidrawInitialized, currentProject, shouldReloadExcalidraw]);

  const triggerReload = useCallback(() => {
    setExcalidrawInitialized(false);
    setShouldReloadExcalidraw(true);
  }, []);

  return {
    excalidrawAPI,
    setExcalidrawAPI,
    saveStatus,
    saveCurrentData,
    triggerReload
  };
}; 