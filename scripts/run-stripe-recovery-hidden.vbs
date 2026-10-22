Option Explicit

Dim fileSystem, shell, arguments, projectDirectory, command, exitCode
Set fileSystem = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
Set arguments = WScript.Arguments

If arguments.Count <> 3 Then WScript.Quit 2

projectDirectory = fileSystem.GetParentFolderName(fileSystem.GetParentFolderName(WScript.ScriptFullName))
shell.CurrentDirectory = projectDirectory
command = Quote(arguments(0)) & " " & Quote(arguments(1)) & " " & Quote(arguments(2))
exitCode = shell.Run(command, 0, True)
WScript.Quit exitCode

Function Quote(value)
  Quote = Chr(34) & value & Chr(34)
End Function
