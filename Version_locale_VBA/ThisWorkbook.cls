VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "ThisWorkbook"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
Option Explicit


' -----------------------
'
' Fonction lancée au demarrage du jeu
'
' -----------------------
Private Sub Workbook_Open()

    ' La feuille Excel à l'arrière est cachée
    Application.Visible = False

    ' Affichage du fond d'ecran
    Set frm_Fond = New Fond_ecran
    frm_Fond.Show vbModeless
      
    ' Création d'une nouvelle frame "Creation_partie"
    Set frm_Nouvelle_partie = New Creation_partie

    ' Appel a la fonction réalisant la mise en forme de l'affichage un début de création de partie
    Setup_affichage_pour_nouvelle_partie

    ' Centrer le UserForm
    CentreUserForm frm_Nouvelle_partie

    ' Affichage de la frame
    frm_Nouvelle_partie.Show
    
End Sub
