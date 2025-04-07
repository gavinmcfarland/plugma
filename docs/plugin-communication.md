```mermaid
sequenceDiagram
    participant BuildProcess
    participant FigmaMonitor
    participant FigmaMain
    participant FigmaBridge
    participant TestRunner
    participant PluginUI

    opt testing flow
        alt vite
            BuildProcess->>PluginUI: build started
            PluginUI->PluginUI: Hot reload
            BuildProcess->>FigmaMonitor: main file changed
            FigmaMonitor->FigmaBridge: reload plugin
        else vitest run
            BuildProcess->TestRunner: trigger test run
        end


        note right of FigmaMain: vite replaces reference \nto plugma/testing to \nplugma/testing/figma
        FigmaMain->>+FigmaMain: test()
        FigmaMain->>-FigmaMain: registry.register()
        BuildProcess->>BuildProcess: file change detected
        BuildProcess->>BuildProcess: delay(200)
        BuildProcess->>TestRunner: emit("FILE_CHANGED")

        TestRunner->>TestRunner: on("FILE_CHANGED")
        TestRunner->>FigmaBridge: emit("RUN_TEST")
        FigmaBridge->>FigmaBridge: on("FILE_CHANGED")

        alt relay message
            FigmaBridge-->>FigmaMain: postMessage("RUN_TEST")
            FigmaMain->>FigmaMain: listen("RUN_TEST")
            FigmaMain->>FigmaMain: registry.runTest()
        else success
            FigmaMain->>FigmaBridge: postMessage("TEST_ASSERTIONS")
            FigmaBridge->>FigmaBridge: listen("TEST_ASSERTIONS")
            FigmaBridge->>TestRunner: emit("TEST_ASSERTIONS")
            TestRunner->>TestRunner: executeAssertions()
        else error
            FigmaMain->>FigmaBridge: postMessage("TEST_ERROR")
            FigmaBridge->>FigmaBridge: listen("TEST_ERROR")
            FigmaBridge->>TestRunner: emit("TEST_ERROR")
            TestRunner->>TestRunner: reportError()
        end
    end

```
